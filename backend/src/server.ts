import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { App } from "@slack/bolt";
import { Agent } from "./agent";
import { setupWebAdapter } from "./adapters/web-adapter";
import { setupSlackAdapter } from "./adapters/slack-adapter";

// Load environment variables from .env file
dotenv.config();

const app = express();
const agent = new Agent();

// Middleware
app.use(express.json());
app.use(cors());

// Web adapter
setupWebAdapter(app, agent);

// Slack adapter - using Socket Mode
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

setupSlackAdapter(slackApp, agent);

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Web chat endpoint: POST http://localhost:${PORT}/api/chat`);
});

// Start Slack app with Socket Mode
(async () => {
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
    await slackApp.start(process.env.SLACK_PORT || 3001);
    console.log(`✓ Slack bot running on Socket Mode (port ${process.env.SLACK_PORT || 3001})`);
  } else {
    console.log(
      "⚠ Slack credentials not set. Slack bot will not start. Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN to enable."
    );
  }
})();
