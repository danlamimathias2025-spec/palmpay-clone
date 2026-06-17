import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for SMS
  app.post("/api/send-sms", async (req, res) => {
    const { phoneNumber, amount } = req.body;
    const apiKey = process.env.SMSAPI_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "SMSAPI_KEY not configured" });
    }

    try {
      // Mocking the SMS API request, replace with actual provider logic
      console.log(`Sending SMS to ${phoneNumber}: "your account has been credited with ₦${amount}"`);
      
      // In a real scenario, use:
      // await axios.post("https://api.smsprovider.com/send", { ... }, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      
      res.json({ success: true });
    } catch (error) {
      console.error("SMS failed:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Helper helper to get the resolved bank api key from Vercel/local environment
  const getBankApiKey = () => {
    return process.env.BANK_API_KEY || 
           process.env.VITE_BANK_API_KEY || 
           process.env.PAYSTACK_SECRET_KEY || 
           process.env.PAYSTACK_KEY || 
           "";
  };

  // API route to get bank list
  app.get("/api/banks", async (req, res) => {
    const apiKey = getBankApiKey();
    if (!apiKey) {
      console.warn("BANK_API_KEY is not configured. Falling back to mock bank list.");
      // Standard list of active major Nigerian banks as fallback
      return res.json([
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
      ]);
    }
    try {
      const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Paystack API error:", data);
        // Fallback to avoid breaking the UI for the user
        return res.json([
          { name: 'Access Bank (Fallback)', code: '044' },
          { name: 'Zenith Bank (Fallback)', code: '057' },
          { name: 'Guaranty Trust Bank (GTBank) (Fallback)', code: '058' },
          { name: 'United Bank for Africa (UBA) (Fallback)', code: '033' }
        ]);
      }
      res.json(data.data);
    } catch (error) {
      console.error("Error fetching banks:", error);
      // Fallback
      res.json([
        { name: 'Access Bank (Fallback)', code: '044' },
        { name: 'Zenith Bank (Fallback)', code: '057' },
        { name: 'Guaranty Trust Bank (GTBank) (Fallback)', code: '058' }
      ]);
    }
  });

  // API route to resolve account
  app.post("/api/resolve-account", async (req, res) => {
     const { accountNumber, bankCode } = req.body;
     const apiKey = getBankApiKey();
     
     if (!apiKey) {
        console.warn("BANK_API_KEY and related environment keys not configured. Falling back to custom mock account name.");
        if (accountNumber && accountNumber.length === 10) {
           return res.json({ account_name: 'Jane Doe (Mock Verification)' });
        } else {
           return res.status(400).json({ error: 'NUBAN account number must be exactly 10 digits.' });
        }
     }
     try {
       const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
         headers: { 'Authorization': `Bearer ${apiKey}` }
       });
       const data = await response.json();
       
       if (response.ok) {
         res.json({ account_name: data.data.account_name });
       } else {
         console.warn("Paystack resolution error:", data);
         // Fallback to custom mock verification if paystack returns key errors to avoid blocking local/custom staging tests
         if (data.message && (data.message.includes("key") || data.message.includes("auth") || data.message.includes("domain"))) {
           return res.json({ account_name: `${accountNumber === '1234567890' ? 'John Doe' : 'Jane Doe'} (API Config Issue Mock)` });
         }
         res.status(response.status).json({ error: data.message || "Account details could not be verified" });
       }
     } catch (error) {
       console.error("Error resolving account:", error);
       res.status(500).json({ error: "Failed to resolve account" });
     }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
