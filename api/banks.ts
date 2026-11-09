import type { IncomingMessage, ServerResponse } from "http";

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

  const getBankApiKey = () => {
    return (
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_API_KEY ||
      process.env.PAYSTACK_KEY ||
      process.env.PAYSTACK ||
      process.env.BANK_API_KEY ||
      process.env.VITE_BANK_API_KEY ||
      process.env.VITE_PAYSTACK_SECRET_KEY ||
      ""
    ).trim();
  };

  const apiKey = getBankApiKey();
  if (!apiKey) {
    console.warn("BANK_API_KEY is not configured on Vercel. Falling back to structured bank list.");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify([
      { name: 'Access Bank', code: '044' },
      { name: 'Zenith Bank', code: '057' },
      { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
      { name: 'United Bank for Africa (UBA)', code: '033' },
      { name: 'First Bank of Nigeria', code: '011' },
      { name: 'Fidelity Bank', code: '070' },
      { name: 'Wema Bank', code: '035' },
      { name: 'Kuda Bank', code: '50211' },
      { name: 'OPay', code: '999992' },
      { name: 'Moniepoint', code: '50515' }
    ]));
  }

  try {
    const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Paystack API error on Vercel serverless:", data);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify([
        { name: 'Access Bank (Fallback)', code: '044' },
        { name: 'Zenith Bank (Fallback)', code: '057' },
        { name: 'Guaranty Trust Bank (GTBank) (Fallback)', code: '058' }
      ]));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(data.data));
  } catch (error) {
    console.error("Vercel error fetching banks:", error);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify([
      { name: 'Access Bank (Exception Fallback)', code: '044' },
      { name: 'Zenith Bank (Exception Fallback)', code: '057' }
    ]));
  }
}
