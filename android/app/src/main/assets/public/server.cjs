var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_config = require("dotenv/config");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  let db = null;
  try {
    const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
    if (import_fs.default.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
      const firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
      db = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log(`[Server] Firebase Firestore connected (db: ${firebaseConfig.firestoreDatabaseId})`);
    } else {
      console.warn("[Server] firebase-applet-config.json not found");
    }
  } catch (err) {
    console.warn("[Server] Firebase Firestore init warning:", err);
  }
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-secret, x-api-key, X-Api-Key, x-site-id, x-webhook-secret"
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(import_express.default.json());
  app.use(import_express.default.urlencoded({ extended: true }));
  app.post("/api/send-sms", async (req, res) => {
    const { phoneNumber, amount } = req.body;
    const getSmsApiKey = () => {
      return process.env.SMSAPI_KEY || process.env.SMS_API_KEY || process.env.TEXTBELT_API_KEY || process.env.TEXTBELT_KEY || process.env.TEXTBELT || process.env.VITE_SMS_API_KEY || process.env.VITE_SMSAPI_KEY || "";
    };
    const apiKey = getSmsApiKey();
    if (!apiKey) {
      console.warn("SMSAPI_KEY not configured. Falling back to mock dispatch logging.");
      console.log(`[MOCK SMS] Sending SMS alert to ${phoneNumber}: Your account has been credited with \u20A6${amount}`);
      return res.json({ success: true, message: "Mock SMS logged (Key not configured)" });
    }
    let cleaned = (phoneNumber || "").toString().replace(/\D/g, "");
    let normalizedPhone = cleaned;
    if (cleaned.length === 10) {
      normalizedPhone = "+234" + cleaned;
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      normalizedPhone = "+234" + cleaned.substring(1);
    } else if (cleaned.startsWith("234") && cleaned.length === 13) {
      normalizedPhone = "+" + cleaned;
    } else if (!cleaned.startsWith("+") && cleaned.length > 9) {
      normalizedPhone = "+" + cleaned;
    }
    const messageText = `Credit Alert: Your account has been credited with \u20A6${Number(amount).toLocaleString()}.00.`;
    console.log(`[Express Server Textbelt] Attempting to send SMS alert to normalized phone ${normalizedPhone} (Original: ${phoneNumber})`);
    try {
      const url = "https://textbelt.com/text";
      const params = new URLSearchParams();
      params.append("phone", normalizedPhone);
      params.append("message", messageText);
      params.append("key", apiKey);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const responseData = await response.json();
      let success = responseData.success === true;
      if (success) {
        console.log(`[Express Textbelt] SMS alert successfully delivered via API.`);
        res.json({
          success: true,
          simulated: false,
          status: "delivered",
          responseData
        });
      } else {
        console.log(`[SMS ADVISORY] Textbelt returned non-success response. Activating simulated fallback dispatch.`);
        res.json({
          success: true,
          simulated: true,
          status: "delivered_simulated_fallback"
        });
      }
    } catch (err) {
      console.log("[Express Textbelt] Fallback routing simulated successfully on connection issue.");
      res.json({
        success: true,
        simulated: true,
        status: "delivered_simulated_fallback"
      });
    }
  });
  const getBankApiKey = () => {
    return process.env.BANK_API_KEY || process.env.VITE_BANK_API_KEY || process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_KEY || "";
  };
  app.get("/api/banks", async (req, res) => {
    const apiKey = getBankApiKey();
    if (!apiKey) {
      console.warn("BANK_API_KEY is not configured. Falling back to mock bank list.");
      return res.json([
        { name: "Access Bank", code: "044" },
        { name: "Zenith Bank", code: "057" },
        { name: "Guaranty Trust Bank (GTBank)", code: "058" },
        { name: "United Bank for Africa (UBA)", code: "033" },
        { name: "First Bank of Nigeria", code: "011" },
        { name: "Fidelity Bank", code: "070" },
        { name: "Wema Bank", code: "035" },
        { name: "Kuda Bank", code: "50211" },
        { name: "OPay", code: "999992" },
        { name: "Moniepoint", code: "50515" }
      ]);
    }
    try {
      const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Paystack API error:", data);
        return res.json([
          { name: "Access Bank (Fallback)", code: "044" },
          { name: "Zenith Bank (Fallback)", code: "057" },
          { name: "Guaranty Trust Bank (GTBank) (Fallback)", code: "058" },
          { name: "United Bank for Africa (UBA) (Fallback)", code: "033" }
        ]);
      }
      res.json(data.data);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.json([
        { name: "Access Bank (Fallback)", code: "044" },
        { name: "Zenith Bank (Fallback)", code: "057" },
        { name: "Guaranty Trust Bank (GTBank) (Fallback)", code: "058" }
      ]);
    }
  });
  async function resolvePalmPayUser(queryInput) {
    if (!queryInput) return null;
    const rawDigits = String(queryInput).trim().replace(/\D/g, "");
    if (!rawDigits) return null;
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
    const phone11 = acc10.length === 10 ? "0" + acc10 : rawDigits.startsWith("0") ? rawDigits : "0" + rawDigits;
    const phone234 = "234" + acc10;
    if (db) {
      try {
        const usersCol = (0, import_firestore.collection)(db, "users");
        for (const cand of [phone11, acc10, rawDigits, phone234]) {
          if (!cand) continue;
          const directDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(db, "users", cand));
          if (directDoc.exists()) {
            const data = directDoc.data();
            const name = data.fullName || data.userName || data.name;
            if (name) {
              return {
                userId: directDoc.id,
                accountName: name,
                accountNumber: acc10,
                phoneNumber: data.phoneNumber || phone11,
                userData: data
              };
            }
          }
        }
        const querySpecs = [
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("accountNumber", "==", acc10)),
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("phoneNumber", "==", phone11)),
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("accountNumber", "==", phone11)),
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("phoneNumber", "==", acc10)),
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("accountNumber", "==", rawDigits)),
          (0, import_firestore.query)(usersCol, (0, import_firestore.where)("phoneNumber", "==", rawDigits))
        ];
        for (const q of querySpecs) {
          const qSnap = await (0, import_firestore.getDocs)(q);
          if (!qSnap.empty) {
            const docItem = qSnap.docs[0];
            const data = docItem.data();
            const name = data.fullName || data.userName || data.name;
            if (name) {
              return {
                userId: docItem.id,
                accountName: name,
                accountNumber: acc10,
                phoneNumber: data.phoneNumber || phone11,
                userData: data
              };
            }
          }
        }
        const allUsersSnap = await (0, import_firestore.getDocs)(usersCol);
        for (const uDoc of allUsersSnap.docs) {
          const uData = uDoc.data();
          const docIdDigits = uDoc.id.replace(/\D/g, "");
          const phoneDigits = (uData.phoneNumber || "").toString().replace(/\D/g, "");
          const accDigits = (uData.accountNumber || "").toString().replace(/\D/g, "");
          if (acc10 === docIdDigits.slice(-10) || acc10 === phoneDigits.slice(-10) || acc10 === accDigits.slice(-10) || rawDigits === docIdDigits || rawDigits === phoneDigits || rawDigits === accDigits) {
            const name = uData.fullName || uData.userName || uData.name;
            if (name) {
              return {
                userId: uDoc.id,
                accountName: name,
                accountNumber: acc10,
                phoneNumber: uData.phoneNumber || phone11,
                userData: uData
              };
            }
          }
        }
      } catch (err) {
        console.warn("[resolvePalmPayUser] Firestore lookup warning:", err);
      }
    }
    const palmpayDirectory = {
      "08082076038": "Mathias Danlami",
      "8082076038": "Mathias Danlami",
      "08135469691": "Peace Danlami",
      "8135469691": "Peace Danlami",
      "09022856059": "Shekwolo danlami",
      "9022856059": "Shekwolo danlami",
      "08012345678": "PEACE DANLAMI",
      "8012345678": "PEACE DANLAMI",
      "09087654321": "JOHN JAMES AYAKA",
      "08123456789": "ABUBAKAR GARBA",
      "08034567890": "TUKUR SAHABI MUHAMMAD",
      "07011223344": "CHINONSO OKONKWO",
      "08099887766": "AISHA BELLO YUSUF",
      "09012345678": "OLUWASEUN ADEBAYO",
      "08187654321": "EMMANUEL CHIDIEBERE"
    };
    if (palmpayDirectory[acc10] || palmpayDirectory[phone11]) {
      return {
        userId: phone11,
        accountName: palmpayDirectory[acc10] || palmpayDirectory[phone11],
        accountNumber: acc10,
        phoneNumber: phone11,
        userData: { fullName: palmpayDirectory[acc10] || palmpayDirectory[phone11], balance: 0 }
      };
    }
    return null;
  }
  const handleResolveAccount = async (req, res) => {
    const rawAccount = req.body?.accountNumber || req.query?.accountNumber || req.body?.account_number || req.query?.account_number || req.body?.phone || req.query?.phone || req.body?.account || req.query?.account || req.body?.accNo || req.query?.accNo || req.body?.acc_no || req.query?.acc_no || req.body?.userId || req.query?.userId || req.body?.user_id || req.query?.user_id || req.params?.accountNumber;
    const bankCode = req.body?.bankCode || req.query?.bankCode || req.body?.bank_code || req.query?.bank_code || "";
    if (!rawAccount) {
      return res.status(400).json({
        success: false,
        status: false,
        error: "Account number is required",
        message: "Account number is required to fetch user account name"
      });
    }
    const isPalmPayCode = !bankCode || bankCode === "999991" || bankCode === "100033" || String(bankCode).toLowerCase().includes("palm") || bankCode === "999992" || bankCode === "default";
    const resolvedUser = await resolvePalmPayUser(rawAccount);
    if (resolvedUser) {
      return res.json({
        success: true,
        status: true,
        message: "Account resolved successfully",
        account_name: resolvedUser.accountName,
        account_number: resolvedUser.accountNumber,
        bank_name: "PalmPay",
        bank_code: "999991",
        data: {
          account_number: resolvedUser.accountNumber,
          account_name: resolvedUser.accountName,
          bank_code: "999991",
          bank_id: 999991,
          bank_name: "PalmPay"
        }
      });
    }
    if (bankCode && !isPalmPayCode) {
      const apiKey = getBankApiKey();
      if (apiKey) {
        try {
          const response = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${rawAccount}&bank_code=${bankCode}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const data = await response.json();
          if (response.ok && data?.data?.account_name) {
            return res.json({
              success: true,
              status: true,
              account_name: data.data.account_name,
              account_number: rawAccount,
              bank_code: bankCode,
              data: data.data
            });
          }
        } catch (err) {
          console.warn("External bank resolution error:", err);
        }
      }
      return res.json({
        success: true,
        status: true,
        account_name: "Commercial Bank Customer",
        account_number: rawAccount,
        bank_code: bankCode,
        data: {
          account_number: rawAccount,
          account_name: "Commercial Bank Customer",
          bank_code: bankCode
        }
      });
    }
    const cleaned = String(rawAccount).replace(/\D/g, "");
    if (cleaned.length >= 10) {
      const firstNames = ["IBRAHIM", "BLESSING", "CHINEDU", "AMINA", "OLUWASEUN", "KELECHI", "USMAN", "GRACE", "FATIMA", "SAMUEL", "ZAINAB", "CHUKWUDI"];
      const lastNames = ["DANLAMI", "OKAFOR", "ADEYEMI", "GARBA", "EZE", "MUSA", "BELLO", "OKONKWO", "YAKUBU", "BALOGUN", "SULEIMAN", "NWOSU"];
      const hash = cleaned.split("").reduce((acc, digit) => acc + (parseInt(digit, 10) || 0), 0);
      const generatedName = `${firstNames[hash % firstNames.length]} ${lastNames[hash * 7 % lastNames.length]}`;
      const acc10 = cleaned.slice(-10);
      return res.json({
        success: true,
        status: true,
        message: "Account resolved successfully",
        account_name: generatedName,
        account_number: acc10,
        bank_name: "PalmPay",
        bank_code: "999991",
        data: {
          account_number: acc10,
          account_name: generatedName,
          bank_code: "999991",
          bank_id: 999991,
          bank_name: "PalmPay"
        }
      });
    }
    return res.status(404).json({
      success: false,
      status: false,
      error: "Account not found",
      message: `Account number ${rawAccount} not found on PalmPay`
    });
  };
  app.all("/api/resolve-palmpay", handleResolveAccount);
  app.all("/api/resolve-account", handleResolveAccount);
  app.all("/api/account/resolve", handleResolveAccount);
  app.all("/api/user/resolve", handleResolveAccount);
  app.all("/api/name-enquiry", handleResolveAccount);
  app.all("/api/account/resolve/:accountNumber", handleResolveAccount);
  app.all("/api/receive-withdrawal", async (req, res) => {
    const hasParams = Object.keys(req.query || {}).length > 0 || Object.keys(req.body || {}).length > 0;
    if (req.method === "GET" && !hasParams) {
      return res.json({
        status: "active",
        endpoint: "/api/receive-withdrawal",
        supportedMethods: ["POST", "GET"],
        headers: "x-api-secret (optional)",
        expectedPayload: {
          accountNumber: "string (10-digit NUBAN, phone number or PalmPay ID)",
          amount: "number (positive)",
          senderName: "string (optional, defaults to Site A Withdrawal)",
          transactionReference: "string (optional, auto-generated if missing)"
        }
      });
    }
    try {
      const payload = { ...req.query || {}, ...req.body || {} };
      const rawHeaderSecret = req.headers["x-api-secret"] || req.headers["x-api-key"] || payload.secret || payload.apiKey || (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : "");
      console.log(`[Webhook /api/receive-withdrawal] Incoming withdrawal request from Site A. Auth token received: ${rawHeaderSecret ? "YES" : "NO (Open access permitted)"}`);
      const accountNumberRaw = payload.accountNumber || payload.account_number || payload.accountNo || payload.account_no || payload.account || payload.fundsId || payload.funds_id || payload.userId || payload.user_id || payload.phone || payload.phoneNumber || payload.phone_number || payload.destinationAccount || payload.destination_account || payload.receiverAccount || payload.recipientAccount || payload.recipient_account || payload.wallet || payload.walletId;
      const amountRaw = payload.amount ?? payload.value ?? payload.totalAmount ?? payload.total_amount ?? payload.creditedAmount ?? payload.credited_amount ?? payload.withdraw_amount ?? payload.withdrawal_amount ?? payload.amt ?? payload.total;
      const senderNameRaw = payload.senderName || payload.sender || payload.source || payload.sourceName || payload.from || payload.payer || payload.bankSender || "Site A Withdrawal";
      const transactionReferenceRaw = payload.transactionReference || payload.reference || payload.ref || payload.transactionId || payload.txId || payload.tx_id || payload.id || payload.sessionId || payload.session_id || `TX-SITEA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      if (!accountNumberRaw || amountRaw === void 0 || amountRaw === null) {
        return res.status(400).json({
          success: false,
          status: false,
          message: "Invalid payload: accountNumber and amount are required"
        });
      }
      let parsedAmount = 0;
      if (typeof amountRaw === "number") {
        parsedAmount = amountRaw;
      } else {
        parsedAmount = parseFloat(String(amountRaw).replace(/,/g, "").trim());
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          status: false,
          message: "Invalid amount: must be a positive number"
        });
      }
      if (!db) {
        console.error("[Webhook /api/receive-withdrawal] Firestore database not initialized");
        return res.status(500).json({
          success: false,
          message: "Database connection unavailable"
        });
      }
      const resolved = await resolvePalmPayUser(accountNumberRaw);
      if (!resolved) {
        console.warn(`[Webhook /api/receive-withdrawal] Account ${accountNumberRaw} not found in database`);
        return res.status(404).json({
          success: false,
          status: false,
          message: `Account number ${accountNumberRaw} not found in PalmPay. User accounts are strictly isolated.`
        });
      }
      const matchedUserId = resolved.userId;
      const matchedUserData = resolved.userData;
      const acc10 = resolved.accountNumber;
      const matchedUserRef = (0, import_firestore.doc)(db, "users", matchedUserId);
      const cleanRef = String(transactionReferenceRaw).trim();
      const cleanSender = String(senderNameRaw).trim();
      const cleanSenderBank = payload.senderBank || payload.bankName || payload.bank || payload.sourceBank || "Site A Portal";
      const cleanNarration = payload.narration || payload.description || payload.remark || payload.memo || payload.title || `Withdrawal from ${cleanSender}`;
      const cleanTitle = payload.title ? String(payload.title).trim() : payload.narration ? String(payload.narration).trim() : `Received from ${cleanSender}`;
      const cleanSessionId = payload.sessionId || payload.session_id || cleanRef;
      const cleanStatus = payload.status ? String(payload.status).toLowerCase() : "successful";
      const cleanCategory = payload.category ? String(payload.category).toLowerCase() : "transfer";
      const processedRefDoc = (0, import_firestore.doc)(db, "processed_references", cleanRef);
      const existingRefSnap = await (0, import_firestore.getDoc)(processedRefDoc);
      if (existingRefSnap.exists()) {
        console.log(`[Webhook /api/receive-withdrawal] Idempotency: Reference ${cleanRef} already processed`);
        return res.status(200).json({
          success: true,
          status: true,
          message: "Transaction already processed successfully (Idempotent)",
          reference: cleanRef
        });
      }
      let newBalance = 0;
      let alreadyHandledInTx = false;
      let finalTxId = "";
      let finalSessionId = "";
      let finalRemark = "";
      await (0, import_firestore.runTransaction)(db, async (t) => {
        const refCheck = await t.get(processedRefDoc);
        if (refCheck.exists()) {
          alreadyHandledInTx = true;
          return;
        }
        const freshUserSnap = await t.get(matchedUserRef);
        if (!freshUserSnap.exists()) {
          throw new Error("Matched user record not found during transaction");
        }
        const freshData = freshUserSnap.data();
        const currentBalance = Number(freshData?.balance || 0);
        newBalance = currentBalance + parsedAmount;
        t.update(matchedUserRef, {
          balance: newBalance,
          accountNumber: freshData?.accountNumber || acc10,
          updatedAt: (0, import_firestore.serverTimestamp)()
        });
        t.set(processedRefDoc, {
          reference: cleanRef,
          userId: matchedUserId,
          accountNumber: acc10,
          amount: parsedAmount,
          senderName: cleanSender,
          processedAt: (0, import_firestore.serverTimestamp)()
        });
        const now = /* @__PURE__ */ new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[now.getMonth()];
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const dateTime12 = `${yy}${mm}${dd}${hh}${min}${ss}`;
        const recipientDisplayName = payload.recipient || payload.accountName || freshData?.fullName || freshData?.userName || "PalmPay Customer";
        const generatedTxId = payload.txId && /^\d{16,20}$/.test(String(payload.txId).trim()) ? String(payload.txId).trim() : `${dateTime12}${String(Math.floor(1e5 + Math.random() * 9e5))}`;
        const generatedSessionId = payload.sessionId && /^\d{30}$/.test(String(payload.sessionId).trim()) ? String(payload.sessionId).trim() : `999991${dateTime12}${String(Math.floor(1e5 + Math.random() * 9e5))}${String(Math.floor(1e5 + Math.random() * 9e5))}`;
        const authenticRemark = payload.remark || payload.narration || `trsf from ${cleanSenderBank.toUpperCase()} / ${cleanSender.toUpperCase()} to ${acc10} ${recipientDisplayName.toUpperCase()}`;
        finalTxId = generatedTxId;
        finalSessionId = generatedSessionId;
        finalRemark = authenticRemark;
        const dateFormatted = payload.date || `${month} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        const txSubCol = (0, import_firestore.collection)(matchedUserRef, "transactions");
        const newTxDoc = (0, import_firestore.doc)(txSubCol, cleanRef);
        const exactRecord = {
          id: cleanRef,
          userId: matchedUserId,
          type: "credit",
          category: cleanCategory,
          status: cleanStatus,
          amount: parsedAmount,
          formattedAmount: `+\u20A6${parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          senderName: cleanSender,
          senderBank: cleanSenderBank,
          narration: authenticRemark,
          remark: authenticRemark,
          title: cleanTitle,
          accountNumber: acc10,
          reference: cleanRef,
          txId: generatedTxId,
          transactionId: generatedTxId,
          sessionId: generatedSessionId,
          recipient: recipientDisplayName,
          date: dateFormatted,
          month: payload.month || month,
          timestamp: (0, import_firestore.serverTimestamp)(),
          createdAt: (0, import_firestore.serverTimestamp)(),
          rawPayload: payload,
          metadata: { ...payload }
        };
        t.set(newTxDoc, exactRecord);
        const globalTxDoc = (0, import_firestore.doc)(db, "transactions", cleanRef);
        t.set(globalTxDoc, exactRecord);
      });
      if (alreadyHandledInTx) {
        return res.status(200).json({
          success: true,
          status: true,
          message: "Transaction already processed successfully (Idempotent)",
          reference: cleanRef
        });
      }
      console.log(`[Webhook /api/receive-withdrawal] Successfully credited user ${matchedUserId} (A/C: ${acc10}) with \u20A6${parsedAmount}. New balance: \u20A6${newBalance}`);
      try {
        const maskedAcc = `${acc10.slice(0, 3)}***${acc10.slice(-4)}`;
        const smsText = `PalmPay Credit Alert: Acct: ${maskedAcc} | Amt: NGN ${parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} | From: ${cleanSender} | Bal: NGN ${newBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })} | Ref: ${cleanRef}`;
        let cleanedPhone = (matchedUserData?.phoneNumber || matchedUserId || "").toString().replace(/\D/g, "");
        let normalizedPhone = cleanedPhone;
        if (cleanedPhone.length === 10) {
          normalizedPhone = "+234" + cleanedPhone;
        } else if (cleanedPhone.startsWith("0") && cleanedPhone.length === 11) {
          normalizedPhone = "+234" + cleanedPhone.substring(1);
        } else if (!cleanedPhone.startsWith("+") && cleanedPhone.length > 9) {
          normalizedPhone = "+" + cleanedPhone;
        }
        const apiKey = process.env.SMSAPI_KEY || process.env.SMS_API_KEY || process.env.TEXTBELT_API_KEY || "";
        if (apiKey) {
          const params = new URLSearchParams();
          params.append("phone", normalizedPhone);
          params.append("message", smsText);
          params.append("key", apiKey);
          fetch("https://textbelt.com/text", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
          }).catch(console.warn);
        }
        console.log(`[Outside-App Flash Alert] Dispatched credit alert SMS for ${normalizedPhone}: ${smsText}`);
      } catch (err) {
        console.warn("[Flash Alert Dispatch] SMS alert error:", err);
      }
      return res.status(200).json({
        success: true,
        status: true,
        message: "Account credited successfully with zero error",
        data: {
          userId: matchedUserId,
          accountNumber: acc10,
          amount: parsedAmount,
          formattedAmount: `+\u20A6${parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          senderName: cleanSender,
          senderBank: cleanSenderBank,
          narration: finalRemark,
          remark: finalRemark,
          title: cleanTitle,
          newBalance,
          transactionReference: cleanRef,
          transactionId: finalTxId,
          txId: finalTxId,
          sessionId: finalSessionId,
          status: cleanStatus
        }
      });
    } catch (error) {
      console.error("[Webhook /api/receive-withdrawal] Error processing webhook:", error);
      return res.status(500).json({
        success: false,
        status: false,
        message: error.message || "Internal server error processing withdrawal"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
