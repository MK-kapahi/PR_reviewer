import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch"; // If Node < 18
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// ✅ Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// ✅ Verify GitHub webhook signature
function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

// ✅ Webhook endpoint
app.post("/webhook", async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event === "pull_request" && payload.action === "opened") {
    const prTitle = payload.pull_request.title;
    const prBody = payload.pull_request.body || "No description";
    const prDiffUrl = payload.pull_request.diff_url;

    console.log(`🔔 New PR: ${prTitle}`);

    // Fetch PR diff
    const diffText = await fetch(prDiffUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    }).then((res) => res.text());

    console.log("PR Diff fetched", diffText);

    // ✅ Create review prompt
    const reviewPrompt = `
You are a senior code reviewer. Analyze this Pull Request.
Highlight possible issues, risks, improvements, and security concerns.

PR Title: ${prTitle}
PR Description: ${prBody}
PR Diff:
${diffText}
`;

    try {
      // ✅ Send to Gemini
      const result = await model.generateContent(reviewPrompt);
      const review = result.response.text() || "⚠️ No review generated";

      console.log("🤖 AI Review:\n", review);
      console.log("Posting review to GitHub...", payload.pull_request.comments_url);

      const reviewUrl = `${payload.pull_request.url}/reviews`;
      await fetch(reviewUrl, {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          body: `🤖 **AI Code Review**\n\n${review}`,
        }),
      });

      console.log("✅ Review posted to GitHub PR");
      return res.status(200).send({
        message: "PR review generated ✅",
        review,
      });
    } catch (err) {
      console.error("❌ Error calling Gemini:", err);
      return res.status(500).send("Error generating review");
    }
  }

  res.status(200).send("Event ignored");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running at http://localhost:${PORT}`);
});
