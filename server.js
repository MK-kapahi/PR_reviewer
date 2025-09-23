import express from "express";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
const app = express();
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Step 1 - Redirect user to GitHub
app.get("/auth/github", (req, res) => {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user:email`
  );
});

// Step 2 - GitHub callback
app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;

  // Exchange code for token
  const tokenResponse = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenResponse.data.access_token;

  // Get user data
  const userResponse = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  res.json(userResponse.data);
});

app.listen(3002, () => console.log("Server running on http://localhost:3002"));
