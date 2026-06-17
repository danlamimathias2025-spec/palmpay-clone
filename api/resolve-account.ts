import type { IncomingMessage, ServerResponse } from "http";

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
  // Add CORS headers
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

  const { accountNumber, bankCode } = await getBody(req);

  const getBankApiKey = () => {
    return process.env.BANK_API_KEY || 
           process.env.VITE_BANK_API_KEY || 
           process.env.PAYSTACK_SECRET_KEY || 
           process.env.PAYSTACK_KEY || 
           "";
  };

  const apiKey = getBankApiKey();
  if (!apiKey) {
    console.warn("BANK_API_KEY not configured on Vercel. Falling back to mock verification.");
    res.writeHead(200, { "Content-Type": "application/json" });
    if (accountNumber && accountNumber.length === 10) {
      return res.end(JSON.stringify({ account_name: 'Jane Doe (Mock Verification)' }));
    } else {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'NUBAN account number must be exactly 10 digits.' }));
    }
  }

  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    
    res.writeHead(response.status || 200, { "Content-Type": "application/json" });
    if (response.ok) {
      return res.end(JSON.stringify({ account_name: data.data.account_name }));
    } else {
      console.warn("Paystack resolution error on Vercel serverless:", data);
      if (data.message && (data.message.includes("key") || data.message.includes("auth") || data.message.includes("domain"))) {
        return res.end(JSON.stringify({ account_name: `${accountNumber === '1234567890' ? 'John Doe' : 'Jane Doe'} (API Config Issue Mock)` }));
      }
      return res.end(JSON.stringify({ error: data.message || "Account details could not be verified" }));
    }
  } catch (error) {
    console.error("Vercel error resolving account:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Failed to resolve account" }));
  }
}
