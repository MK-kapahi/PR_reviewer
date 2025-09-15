import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
// import crypto from "crypto";
// import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
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
app.post("/webhook", async (req, res) => {
  console.log("✅ Webhook received",req);
  console.log("webhook successfylly running ")
  if (!verifySignature(req)) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event === "pull_request" && payload.action === "opened") {
    const prTitle = payload.pull_request.title;
    const prBody = payload.pull_request.body || "No description";
    const prDiffUrl = payload.pull_request.diff_url;
    const commentsUrl = payload.pull_request.comments_url;

    console.log(`🔔 New PR: ${prTitle}`);

    // Fetch PR diff
    const diffText = await fetch(prDiffUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    }).then(res => res.text());

//     // Prepare AI prompt
//     const reviewPrompt = `
// You are a senior code reviewer.
// Review the following PR.
// Highlight possible issues, risks, and improvements.

// PR Title: ${prTitle}
// PR Description: ${prBody}

// PR Diff:
// ${diffText}
// `;

//     // Send to AI
//     const response = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: reviewPrompt }]
//     });

//     const review = response.choices[0].message.content;
//     console.log("AI Review:", review);

//     // Post comment back to GitHub
//     await fetch(commentsUrl, {
//       method: "POST",
//       headers: {
//         "Authorization": `token ${GITHUB_TOKEN}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ body: review })
//     });

//     res.status(200).send("PR review posted ✅");
//   } else {
//     res.status(200).send("Event ignored");
//   }
}});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running at http://localhost:${PORT}`);
});
