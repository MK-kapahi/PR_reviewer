import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
// import crypto from "crypto";
// import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
// const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// ✅ Verify GitHub webhook signature
// function verifySignature(req) {
//   const signature = req.headers["x-hub-signature-256"];
//   if (!signature) return false;

//   const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
//   const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;
//   return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
// }

// ✅ Webhook endpoint
app.post("/webhook", (req, res) => {
  console.log("✅ Webhook received!");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  // Respond OK so GitHub knows delivery was successful
  res.sendStatus(200);
});

// Health check (optional)
app.get("/", (req, res) => {
  res.send("🚀 Webhook server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running at http://localhost:${PORT}`);
});
