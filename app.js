import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch"; // If Node < 18
import crypto from "crypto";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

dotenv.config();
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const REGION = process.env.AWS_REGION || "us-east-1";

// ✅ AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({ region: REGION });

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
  console.log("✅ Webhook received",req);

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

    console.log("PR Diff fetched",diffText);

    // ✅ Create review prompt
    const reviewPrompt = `
You are a senior code reviewer. Analyze this Pull Request.
Highlight possible issues, risks, improvements, and security concerns.

PR Title: ${prTitle}
PR Description: ${prBody}
PR Diff:
${diffText}
`;

    // ✅ Send to Amazon Nova Pro
    const command = new ConverseCommand({
      modelId: "amazon.nova-pro-v1:0",
      messages: [{ role: "user", content: [{ text: reviewPrompt }] }],
    });

    try {
      const response = await bedrockClient.send(command);
      console.log("Bedrock response:", response);
      const review =
        response.output?.message?.content?.[0]?.text || "⚠️ No review generated";

      console.log("🤖 AI Review:\n", review);

      // Show result to GitHub (for now just return in response)
      return res.status(200).send({
        message: "PR review generated ✅",
        review,
      });
    } catch (err) {
      console.error("❌ Error calling Bedrock:", err);
      return res.status(500).send("Error generating review");
    }
  }

  res.status(200).send("Event ignored");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running at http://localhost:${PORT}`);
});
