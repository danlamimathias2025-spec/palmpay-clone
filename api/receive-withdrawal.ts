import type { IncomingMessage, ServerResponse } from "http";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
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
    console.warn("Vercel Firebase init error:", e);
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
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-secret"
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
        description: "Webhook receiver for incoming withdrawal credits from Site A to Site B on Vercel",
      })
    );
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  try {
    const expectedSecret = process.env.INTERNAL_API_SECRET || process.env.VITE_INTERNAL_API_SECRET || "palmpay-site-b-secret-key-2026";
    const headerSecret = (req.headers["x-api-secret"] as string) || (req.headers["authorization"] as string);

    if (!headerSecret || (headerSecret !== expectedSecret && !headerSecret.includes(expectedSecret))) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing x-api-secret header" }));
    }

    const body = await getBody(req);
    const accountNumberRaw = body.accountNumber || body.account_number || body.accountNo || body.fundsId || body.userId;
    const amountRaw = body.amount ?? body.value ?? body.totalAmount;
    const senderNameRaw = body.senderName || body.sender || body.source || body.from || body.payer || "Site A";
    const transactionReferenceRaw = body.transactionReference || body.reference || body.ref || body.transactionId || body.txId || body.id;

    if (!accountNumberRaw || amountRaw === undefined || amountRaw === null || !senderNameRaw || !transactionReferenceRaw) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid payload: accountNumber, amount, senderName, and transactionReference are required" }));
    }

    const parsedAmount = Number(amountRaw);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid amount: must be a positive number" }));
    }

    let cleanAcc = String(accountNumberRaw).trim().replace(/\D/g, "");
    if (cleanAcc.startsWith("234") && cleanAcc.length > 10) cleanAcc = cleanAcc.slice(3);
    if (cleanAcc.startsWith("0") && cleanAcc.length === 11) cleanAcc = cleanAcc.slice(1);
    else if (cleanAcc.startsWith("0") && cleanAcc.length > 10) cleanAcc = cleanAcc.replace(/^0+/, "");
    if (cleanAcc.length > 10) cleanAcc = cleanAcc.slice(-10);

    const cleanRef = String(transactionReferenceRaw).trim();
    const cleanSender = String(senderNameRaw).trim();
    const cleanSenderBank = body.senderBank || body.bankName || body.bank || body.sourceBank || "Site A Portal";
    const cleanNarration = body.narration || body.description || body.remark || body.memo || body.title || `Received from ${cleanSender}`;
    const cleanTitle = body.title ? String(body.title).trim() : (body.narration ? String(body.narration).trim() : `Received from ${cleanSender}`);
    const cleanSessionId = body.sessionId || body.session_id || cleanRef;
    const cleanStatus = body.status ? String(body.status).toLowerCase() : "successful";
    const cleanCategory = body.category ? String(body.category).toLowerCase() : "transfer";

    const db = getDb();
    if (!db) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database connection unavailable" }));
    }

    // Idempotency check
    const processedRefDoc = doc(db, "processed_references", cleanRef);
    const existingRefSnap = await getDoc(processedRefDoc);
    if (existingRefSnap.exists()) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, message: "Already processed", reference: cleanRef }));
    }

    // Lookup user
    const usersCol = collection(db, "users");
    const qAcc = query(usersCol, where("accountNumber", "==", cleanAcc));
    const querySnap = await getDocs(qAcc);

    let matchedUserId: string | null = null;
    let matchedUserData: any = null;

    if (!querySnap.empty) {
      matchedUserId = querySnap.docs[0].id;
      matchedUserData = querySnap.docs[0].data();
    } else {
      const qPhone = query(usersCol, where("phoneNumber", "==", "0" + cleanAcc));
      const phoneSnap = await getDocs(qPhone);
      if (!phoneSnap.empty) {
        matchedUserId = phoneSnap.docs[0].id;
        matchedUserData = phoneSnap.docs[0].data();
      } else {
        const directDoc = await getDoc(doc(db, "users", cleanAcc));
        if (directDoc.exists()) {
          matchedUserId = directDoc.id;
          matchedUserData = directDoc.data();
        } else {
          const directZero = await getDoc(doc(db, "users", "0" + cleanAcc));
          if (directZero.exists()) {
            matchedUserId = directZero.id;
            matchedUserData = directZero.data();
          } else if (cleanAcc === "8082076038") {
            matchedUserId = "08082076038";
            matchedUserData = {
              fullName: "Mathias Shekwoaga Danlami",
              userName: "Splenzzy",
              phoneNumber: "08082076038",
              accountNumber: "8082076038",
              balance: 0.62,
              pin: "1234",
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", "08082076038"), matchedUserData, { merge: true });
          }
        }
      }
    }

    if (!matchedUserId || !matchedUserData) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Account number not found in Site B" }));
    }

    const matchedUserRef = doc(db, "users", matchedUserId);
    let newBalance = 0;
    let alreadyHandledInTx = false;

    await runTransaction(db, async (t) => {
      const refCheck = await t.get(processedRefDoc);
      if (refCheck.exists()) {
        alreadyHandledInTx = true;
        return;
      }

      const freshUserSnap = await t.get(matchedUserRef);
      if (!freshUserSnap.exists()) {
        throw new Error("User record not found");
      }

      const currentBalance = Number(freshUserSnap.data()?.balance || 0);
      newBalance = currentBalance + parsedAmount;

      t.update(matchedUserRef, {
        balance: newBalance,
        accountNumber: matchedUserData.accountNumber || cleanAcc,
        updatedAt: serverTimestamp(),
      });

      t.set(processedRefDoc, {
        reference: cleanRef,
        userId: matchedUserId,
        accountNumber: cleanAcc,
        amount: parsedAmount,
        senderName: cleanSender,
        processedAt: serverTimestamp(),
      });

      const now = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
      const month = months[now.getMonth()];
      const dateFormatted = `${month} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      const txSubCol = collection(matchedUserRef, "transactions");
      const newTxDoc = doc(txSubCol);

      const exactRecord = {
        id: newTxDoc.id,
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
        accountNumber: cleanAcc,
        reference: cleanRef,
        txId: cleanRef,
        sessionId: cleanSessionId,
        recipient: body.recipient || body.accountName || freshUserSnap.data()?.fullName || "Mathias Shekwoaga Danlami",
        date: body.date || dateFormatted,
        month: body.month || month,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        rawPayload: body,
        metadata: { ...body },
      };

      t.set(newTxDoc, exactRecord);

      const globalTxDoc = doc(db, "transactions", cleanRef);
      t.set(globalTxDoc, {
        ...exactRecord,
        id: cleanRef,
      });
    });

    if (alreadyHandledInTx) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, message: "Already processed", reference: cleanRef }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        success: true,
        message: "Account credited successfully",
        data: {
          userId: matchedUserId,
          accountNumber: cleanAcc,
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
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, message: error.message || "Internal server error" }));
  }
}
