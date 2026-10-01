import type { IncomingMessage, ServerResponse } from "http";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

let dbInstance: any = null;
function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      dbInstance = getFirestore(app, config.firestoreDatabaseId);
    }
  } catch (e) {
    console.warn("Firebase init error in receive-withdrawal:", e);
  }
  return dbInstance;
}

async function getBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-secret, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        status: "active",
        endpoint: "/api/receive-withdrawal",
        methods: ["POST"],
        description: "Webhook receiver for incoming withdrawal credits from Site A to isolated user accounts in PalmPay",
      })
    );
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  try {
    const expectedSecret =
      process.env.INTERNAL_API_SECRET ||
      process.env.VITE_INTERNAL_API_SECRET ||
      "palmpay-site-b-secret-key-2026";

    const rawHeaderSecret =
      (req.headers["x-api-secret"] as string) ||
      (req.headers["authorization"] ? (req.headers["authorization"] as string).replace(/^Bearer\s+/i, "") : "");

    // Allow authorization if secret matches configured secret or default fallback
    const isAuthorized =
      !expectedSecret ||
      rawHeaderSecret === expectedSecret ||
      rawHeaderSecret === "palmpay-site-b-secret-key-2026" ||
      (rawHeaderSecret && rawHeaderSecret.includes(expectedSecret));

    if (!isAuthorized) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing x-api-secret header" }));
    }

    const body = await getBody(req);

    // Extract account number with extensive key compatibility
    const accountNumberRaw =
      body.accountNumber ||
      body.account_number ||
      body.accountNo ||
      body.account_no ||
      body.fundsId ||
      body.funds_id ||
      body.userId ||
      body.user_id ||
      body.phone ||
      body.phoneNumber ||
      body.phone_number ||
      body.destinationAccount ||
      body.destination_account ||
      body.receiverAccount ||
      body.recipientAccount;

    const amountRaw =
      body.amount ??
      body.value ??
      body.totalAmount ??
      body.creditedAmount ??
      body.total;

    const senderNameRaw =
      body.senderName ||
      body.sender ||
      body.source ||
      body.from ||
      body.payer ||
      body.sourceName ||
      body.bankSender ||
      "PalmPay Cashback";

    const transactionReferenceRaw =
      body.transactionReference ||
      body.reference ||
      body.ref ||
      body.transactionId ||
      body.txId ||
      body.tx_id ||
      body.id ||
      body.sessionId ||
      body.session_id ||
      `TX-PALMPAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!accountNumberRaw || amountRaw === undefined || amountRaw === null) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: false,
          message: "Invalid payload: accountNumber and amount are required",
        })
      );
    }

    // Clean amount (supports numeric or string with commas)
    let parsedAmount = 0;
    if (typeof amountRaw === "number") {
      parsedAmount = amountRaw;
    } else {
      parsedAmount = parseFloat(String(amountRaw).replace(/,/g, "").trim());
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid amount: must be a positive number" }));
    }

    // Normalize account number to canonical 10-digit PalmPay NUBAN and 11-digit phone
    const rawDigits = String(accountNumberRaw).trim().replace(/\D/g, "");
    if (!rawDigits) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid account number: no digits found" }));
    }

    let acc10 = rawDigits;
    if (acc10.startsWith("234") && acc10.length > 10) {
      acc10 = acc10.slice(3);
    }
    if (acc10.startsWith("0") && acc10.length === 11) {
      acc10 = acc10.slice(1);
    } else if (acc10.startsWith("0") && acc10.length > 10) {
      acc10 = acc10.replace(/^0+/, "");
    }
    if (acc10.length > 10) {
      acc10 = acc10.slice(-10);
    }

    const phone11 = acc10.length === 10 ? "0" + acc10 : (rawDigits.startsWith("0") ? rawDigits : "0" + rawDigits);
    const phone234 = "234" + acc10;

    const cleanRef = String(transactionReferenceRaw).trim();
    const cleanSender = String(senderNameRaw).trim();
    const cleanSenderBank = body.senderBank || body.bankName || body.bank || body.sourceBank || "Site A Portal";
    const cleanNarration =
      body.narration || body.description || body.remark || body.memo || body.title || `Received from ${cleanSender}`;
    const cleanTitle = body.title
      ? String(body.title).trim()
      : body.narration
      ? String(body.narration).trim()
      : `Received from ${cleanSender}`;
    const cleanSessionId = body.sessionId || body.session_id || cleanRef;
    const cleanStatus = body.status ? String(body.status).toLowerCase() : "successful";
    const cleanCategory = body.category ? String(body.category).toLowerCase() : "transfer";

    const db = getDb();
    if (!db) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database connection unavailable" }));
    }

    // 1. Idempotency check: avoid double crediting on retries from Site A
    const processedRefDoc = doc(db, "processed_references", cleanRef);
    const existingRefSnap = await getDoc(processedRefDoc);
    if (existingRefSnap.exists()) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: true,
          message: "Transaction already processed successfully (Idempotent)",
          reference: cleanRef,
        })
      );
    }

    // 2. Strict User Isolation: Find the exact user matching this account number
    const usersCol = collection(db, "users");
    let matchedUserId: string | null = null;
    let matchedUserData: any = null;

    // A. Direct doc lookups (fast primary key matches)
    const directCandidates = [phone11, acc10, rawDigits, phone234];
    for (const cand of directCandidates) {
      if (!cand) continue;
      const directDoc = await getDoc(doc(db, "users", cand));
      if (directDoc.exists()) {
        matchedUserId = directDoc.id;
        matchedUserData = directDoc.data();
        break;
      }
    }

    // B. Indexed queries
    if (!matchedUserId) {
      const querySpecs = [
        where("accountNumber", "==", acc10),
        where("phoneNumber", "==", phone11),
        where("accountNumber", "==", phone11),
        where("phoneNumber", "==", acc10),
        where("accountNumber", "==", rawDigits),
        where("phoneNumber", "==", rawDigits),
      ];

      for (const spec of querySpecs) {
        const qSnap = await getDocs(query(usersCol, spec));
        if (!qSnap.empty) {
          matchedUserId = qSnap.docs[0].id;
          matchedUserData = qSnap.docs[0].data();
          break;
        }
      }
    }

    // C. Deep scan across registered users (ensures finding user even if stored with spaces or formatting)
    if (!matchedUserId) {
      const allUsersSnap = await getDocs(usersCol);
      for (const uDoc of allUsersSnap.docs) {
        const uData = uDoc.data();
        const docIdDigits = uDoc.id.replace(/\D/g, "");
        const phoneDigits = (uData.phoneNumber || "").toString().replace(/\D/g, "");
        const accDigits = (uData.accountNumber || "").toString().replace(/\D/g, "");

        if (
          acc10 === docIdDigits.slice(-10) ||
          acc10 === phoneDigits.slice(-10) ||
          acc10 === accDigits.slice(-10) ||
          rawDigits === docIdDigits ||
          rawDigits === phoneDigits ||
          rawDigits === accDigits
        ) {
          matchedUserId = uDoc.id;
          matchedUserData = uData;
          break;
        }
      }
    }

    // If no matching user is found, reject cleanly with 404.
    // NEVER fall back to a default user or combine users!
    if (!matchedUserId || !matchedUserData) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: false,
          message: `Account number ${accountNumberRaw} (NUBAN: ${acc10}) not found in PalmPay. User accounts are strictly isolated.`,
        })
      );
    }

    const matchedUserRef = doc(db, "users", matchedUserId);
    let newBalance = 0;
    let alreadyHandledInTx = false;

    // 3. Atomically update the matched user's balance and append transaction to their isolated subcollection
    await runTransaction(db, async (t) => {
      const refCheck = await t.get(processedRefDoc);
      if (refCheck.exists()) {
        alreadyHandledInTx = true;
        return;
      }

      const freshUserSnap = await t.get(matchedUserRef);
      if (!freshUserSnap.exists()) {
        throw new Error("Target user record not found during transaction");
      }

      const freshData = freshUserSnap.data();
      const currentBalance = Number(freshData?.balance || 0);
      newBalance = currentBalance + parsedAmount;

      // Update matched user's live balance
      t.update(matchedUserRef, {
        balance: newBalance,
        accountNumber: freshData?.accountNumber || acc10,
        updatedAt: serverTimestamp(),
      });

      // Mark reference in idempotency collection
      t.set(processedRefDoc, {
        reference: cleanRef,
        userId: matchedUserId,
        accountNumber: acc10,
        amount: parsedAmount,
        senderName: cleanSender,
        processedAt: serverTimestamp(),
      });

      // Format date for transaction history
      const now = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
      const month = months[now.getMonth()];
      const dateFormatted = `${month} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      const recipientDisplayName =
        body.recipient ||
        body.accountName ||
        freshData?.fullName ||
        freshData?.userName ||
        "PalmPay Customer";

      const txSubCol = collection(matchedUserRef, "transactions");
      const userTxDoc = doc(txSubCol, cleanRef);

      const exactRecord = {
        id: cleanRef,
        userId: matchedUserId,
        type: "credit",
        category: cleanCategory,
        status: cleanStatus,
        amount: parsedAmount,
        formattedAmount: `+₦${parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        senderName: cleanSender,
        senderBank: cleanSenderBank,
        narration: cleanNarration,
        title: cleanTitle,
        accountNumber: acc10,
        reference: cleanRef,
        txId: cleanRef,
        sessionId: cleanSessionId,
        recipient: recipientDisplayName,
        date: body.date || dateFormatted,
        month: body.month || month,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        rawPayload: body,
        metadata: { ...body },
      };

      // Store in user's isolated transactions subcollection
      t.set(userTxDoc, exactRecord);

      // Also store in top-level audit log with cleanRef as key
      const globalTxDoc = doc(db, "transactions", cleanRef);
      t.set(globalTxDoc, exactRecord);
    });

    if (alreadyHandledInTx) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: true,
          message: "Transaction already processed successfully (Idempotent)",
          reference: cleanRef,
        })
      );
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        success: true,
        message: "Account credited successfully with zero error",
        data: {
          userId: matchedUserId,
          accountNumber: acc10,
          amount: parsedAmount,
          formattedAmount: `+₦${parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          senderName: cleanSender,
          senderBank: cleanSenderBank,
          narration: cleanNarration,
          title: cleanTitle,
          newBalance: newBalance,
          transactionReference: cleanRef,
          status: cleanStatus,
        },
      })
    );
  } catch (error: any) {
    console.error("Error processing incoming withdrawal from Site A:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, message: error.message || "Internal server error" }));
  }
}
