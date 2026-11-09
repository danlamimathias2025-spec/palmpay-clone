import type { IncomingMessage, ServerResponse } from "http";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-secret, x-api-key, X-Api-Key, x-site-id, x-webhook-secret"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse query params if available
  const parsedUrl = new URL(req.url || "", "http://localhost");
  const queryParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const body = req.method === "POST" ? await getBody(req) : {};
  const rawAccount =
    body.accountNumber ||
    queryParams.accountNumber ||
    body.account_number ||
    queryParams.account_number ||
    body.phone ||
    queryParams.phone ||
    body.account ||
    queryParams.account ||
    body.accNo ||
    queryParams.accNo ||
    body.userId ||
    queryParams.userId ||
    body.user_id ||
    queryParams.user_id;

  const bankCode =
    body.bankCode ||
    queryParams.bankCode ||
    body.bank_code ||
    queryParams.bank_code ||
    "";

  if (!rawAccount) {
    res.statusCode = 400;
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        success: false,
        status: false,
        error: "Account number is required",
        message: "Account number is required to fetch user account name",
      })
    );
  }

  let cleaned = String(rawAccount).replace(/\D/g, "");
  if (cleaned.startsWith("234") && cleaned.length > 10) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  const acc10 = cleaned.slice(-10);
  const phone11 = "0" + acc10;

  const isPalmPayCode =
    !bankCode ||
    bankCode === "999991" ||
    bankCode === "100033" ||
    String(bankCode).toLowerCase().includes("palm") ||
    bankCode === "999992" ||
    bankCode === "default";

  // 1. Live Firestore Lookup
  const db = getDb();
  if (db) {
    try {
      const usersCol = collection(db, "users");
      const candidates = [phone11, acc10, cleaned, "234" + acc10];
      for (const candidate of candidates) {
        const directDoc = await getDoc(doc(db, "users", candidate));
        if (directDoc.exists()) {
          const d = directDoc.data();
          const name = d?.fullName || d?.userName || d?.name;
          if (name) {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                success: true,
                status: true,
                message: "Account resolved successfully",
                account_name: name,
                account_number: acc10,
                bank_name: "PalmPay",
                bank_code: "999991",
                data: {
                  account_number: acc10,
                  account_name: name,
                  bank_code: "999991",
                  bank_id: 999991,
                  bank_name: "PalmPay",
                },
              })
            );
          }
        }
      }

      const qAcc = query(usersCol, where("accountNumber", "==", acc10));
      const qAccSnap = await getDocs(qAcc);
      if (!qAccSnap.empty) {
        const d = qAccSnap.docs[0].data();
        const name = d?.fullName || d?.userName || d?.name;
        if (name) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: true,
              status: true,
              message: "Account resolved successfully",
              account_name: name,
              account_number: acc10,
              bank_name: "PalmPay",
              bank_code: "999991",
              data: {
                account_number: acc10,
                account_name: name,
                bank_code: "999991",
                bank_id: 999991,
                bank_name: "PalmPay",
              },
            })
          );
        }
      }

      const qPhone = query(usersCol, where("phoneNumber", "==", phone11));
      const qPhoneSnap = await getDocs(qPhone);
      if (!qPhoneSnap.empty) {
        const d = qPhoneSnap.docs[0].data();
        const name = d?.fullName || d?.userName || d?.name;
        if (name) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: true,
              status: true,
              message: "Account resolved successfully",
              account_name: name,
              account_number: acc10,
              bank_name: "PalmPay",
              bank_code: "999991",
              data: {
                account_number: acc10,
                account_name: name,
                bank_code: "999991",
                bank_id: 999991,
                bank_name: "PalmPay",
              },
            })
          );
        }
      }

      // Deep scan registered users
      const allUsersSnap = await getDocs(usersCol);
      for (const uDoc of allUsersSnap.docs) {
        const uData = uDoc.data();
        const docIdDigits = uDoc.id.replace(/\D/g, "");
        const phoneDigits = (uData.phoneNumber || "").toString().replace(/\D/g, "");
        const accDigits = (uData.accountNumber || "").toString().replace(/\D/g, "");

        if (
          acc10 === docIdDigits.slice(-10) ||
          acc10 === phoneDigits.slice(-10) ||
          acc10 === accDigits.slice(-10)
        ) {
          const name = uData.fullName || uData.userName || uData.name;
          if (name) {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                success: true,
                status: true,
                message: "Account resolved successfully",
                account_name: name,
                account_number: acc10,
                bank_name: "PalmPay",
                bank_code: "999991",
                data: {
                  account_number: acc10,
                  account_name: name,
                  bank_code: "999991",
                  bank_id: 999991,
                  bank_name: "PalmPay",
                },
              })
            );
          }
        }
      }
    } catch (err) {
      console.warn("[Vercel Resolve Account] Firestore lookup error:", err);
    }
  }

  // 2. Paystack resolution for external banks and PalmPay accounts
  const apiKey =
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_API_KEY ||
    process.env.PAYSTACK_KEY ||
    process.env.PAYSTACK ||
    process.env.BANK_API_KEY ||
    process.env.VITE_BANK_API_KEY ||
    process.env.VITE_PAYSTACK_SECRET_KEY ||
    "";

  if (apiKey && acc10.length === 10) {
    const candidateCodes: string[] = [];
    if (bankCode && !isPalmPayCode) {
      candidateCodes.push(String(bankCode).trim());
    } else {
      candidateCodes.push("999991", "100033");
    }

    for (const code of candidateCodes) {
      try {
        const response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${acc10}&bank_code=${code}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (response.ok && data?.status && data?.data?.account_name) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: true,
              status: true,
              message: "Account resolved successfully via Paystack",
              account_name: data.data.account_name,
              account_number: acc10,
              bank_code: code,
              data: data.data,
            })
          );
        }
      } catch (err) {
        console.warn("Vercel external bank resolution error:", err);
      }
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(
    JSON.stringify({
      success: false,
      status: false,
      error: "Account not verified",
      message: "Could not auto-verify account name via Paystack. Please enter beneficiary name manually.",
    })
  );
}
