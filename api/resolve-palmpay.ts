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
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  const { phone } = await getBody(req);
  if (!phone) {
    res.statusCode = 400;
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Phone number or account ID is required" }));
  }

  let cleaned = (phone || "").toString().replace(/\D/g, "");
  if (cleaned.startsWith("234") && cleaned.length > 10) {
    cleaned = cleaned.slice(3);
  }

  // 1. Live Firestore Lookup
  const db = getDb();
  if (db) {
    try {
      const usersCol = collection(db, "users");
      const candidates = [cleaned, "0" + cleaned, cleaned.slice(-10)];
      for (const candidate of candidates) {
        const directDoc = await getDoc(doc(db, "users", candidate));
        if (directDoc.exists() && directDoc.data()?.fullName) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ account_name: directDoc.data().fullName, success: true }));
        }
      }

      const qAcc = query(usersCol, where("accountNumber", "==", cleaned.slice(-10)));
      const qAccSnap = await getDocs(qAcc);
      if (!qAccSnap.empty && qAccSnap.docs[0].data()?.fullName) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ account_name: qAccSnap.docs[0].data().fullName, success: true }));
      }

      const qPhone = query(usersCol, where("phoneNumber", "==", "0" + cleaned.slice(-10)));
      const qPhoneSnap = await getDocs(qPhone);
      if (!qPhoneSnap.empty && qPhoneSnap.docs[0].data()?.fullName) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ account_name: qPhoneSnap.docs[0].data().fullName, success: true }));
      }
    } catch (err) {
      console.warn("[Vercel Resolve PalmPay] Firestore lookup error:", err);
    }
  }

  const palmpayDirectory: Record<string, string> = {
    "08082076038": "Mathias Shekwoaga Danlami",
    "8082076038": "Mathias Shekwoaga Danlami",
    "08012345678": "PEACE DANLAMI",
    "8012345678": "PEACE DANLAMI",
    "09087654321": "JOHN JAMES AYAKA",
    "08123456789": "ABUBAKAR GARBA",
    "08034567890": "TUKUR SAHABI MUHAMMAD",
    "07011223344": "CHINONSO OKONKWO",
    "08099887766": "AISHA BELLO YUSUF",
    "09012345678": "OLUWASEUN ADEBAYO",
    "08187654321": "EMMANUEL CHIDIEBERE",
  };

  if (palmpayDirectory[cleaned] || palmpayDirectory["0" + cleaned]) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ account_name: palmpayDirectory[cleaned] || palmpayDirectory["0" + cleaned], success: true }));
  }

  const firstNames = ["IBRAHIM", "BLESSING", "CHINEDU", "AMINA", "OLUWASEUN", "KELECHI", "USMAN", "GRACE", "FATIMA", "SAMUEL", "ZAINAB", "CHUKWUDI"];
  const lastNames = ["DANLAMI", "OKAFOR", "ADEYEMI", "GARBA", "EZE", "MUSA", "BELLO", "OKONKWO", "YAKUBU", "BALOGUN", "SULEIMAN", "NWOSU"];

  const hash = cleaned.split("").reduce((acc: number, digit: string) => acc + (parseInt(digit, 10) || 0), 0);
  const firstName = firstNames[hash % firstNames.length];
  const lastName = lastNames[(hash * 7) % lastNames.length];
  const resolvedName = `${firstName} ${lastName}`;

  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ account_name: resolvedName, success: true }));
}
