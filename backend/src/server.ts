import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { App } from "@slack/bolt";
import { Agent } from "./agent";
import { ChatGateway, gateway } from "./gateway/gateway";
import { WebAdapter, setupWebAdapter } from "./adapters/web-adapter";
import { SlackAdapter, setupSlackAdapter } from "./adapters/slack-adapter";
import { DiscordAdapter, setupDiscordAdapter } from "./adapters/discord-adapter";

// Load environment variables from .env file
dotenv.config();

const app = express();
const agent = new Agent();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Chat Gateway
console.log("Initializing Chat Gateway...");

// Web adapter - register with gateway
const webAdapter = new WebAdapter(app, gateway);
gateway.registerAdapter(webAdapter.name, webAdapter);

// Slack adapter - using Socket Mode
let slackAdapter: SlackAdapter | null = null;
let slackApp: App | null = null;

if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
  slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  slackAdapter = new SlackAdapter(slackApp, gateway);
  gateway.registerAdapter(slackAdapter.name, slackAdapter);
} else {
  console.warn(
    "⚠ Slack credentials not set. Slack adapter will not be registered."
  );
}

// Discord adapter - placeholder (not yet fully implemented)
if (process.env.DISCORD_TOKEN) {
  const discordAdapter = setupDiscordAdapter(gateway, process.env.DISCORD_TOKEN);
  gateway.registerAdapter(discordAdapter.name, discordAdapter);
}

// Initialize all adapters
(async () => {
  try {
    // Initialize Web adapter
    await webAdapter.initialize();

    // Initialize Slack adapter if available
    if (slackAdapter && slackApp) {
      await slackAdapter.initialize();
    }

    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✓ Backend server running on http://localhost:${PORT}`);
      console.log(`✓ Web chat endpoint: POST http://localhost:${PORT}/api/chat`);
      console.log(`✓ Chat Gateway active with adapters: ${gateway.listAdapters().join(", ")}`);
    });

    // Start Slack app with Socket Mode if available
    if (slackApp && process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
      await slackApp.start(process.env.SLACK_PORT || 3001);
      console.log(`✓ Slack bot running on Socket Mode (port ${process.env.SLACK_PORT || 3001})`);
    }

    // Log gateway status
    console.log("✓ Gateway initialized successfully");
    console.log(`  Registered adapters: ${gateway.listAdapters().join(", ")}`);
    console.log(`  Configured tenants: ${gateway.listTenants().join(", ")}`);
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();
