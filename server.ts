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

  // API route to get bank list
  app.get("/api/banks", async (req, res) => {
    if (!process.env.BANK_API_KEY) {
        return res.status(500).json({ error: "BANK_API_KEY not configured" });
    }
    try {
      const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
        headers: { 'Authorization': `Bearer ${process.env.BANK_API_KEY}` }
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Paystack API error:", data);
        return res.status(response.status).json({ error: "Paystack API error", details: data });
      }
      res.json(data.data);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ error: "Failed to fetch banks" });
    }
  });

  // API route to resolve account
  app.post("/api/resolve-account", async (req, res) => {
     const { accountNumber, bankCode } = req.body;
     if (!process.env.BANK_API_KEY) {
        return res.status(500).json({ error: "BANK_API_KEY not configured" });
     }
     try {
       const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
         headers: { 'Authorization': `Bearer ${process.env.BANK_API_KEY}` }
       });
       const data = await response.json();
       
       if (response.ok) {
         res.json({ account_name: data.data.account_name });
       } else {
         res.status(response.status).json({ error: data.message });
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
