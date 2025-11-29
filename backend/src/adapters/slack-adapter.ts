import { App, GenericMessageEvent } from "@slack/bolt";
import { ChatGateway } from "../gateway/gateway";
import { GatewayAdapter } from "../gateway/types";

/**
 * Slack Adapter - Handles messages from Slack using Socket Mode
 * Integrates with the Chat Gateway
 */
export class SlackAdapter implements GatewayAdapter {
  name = "slack";
  platform = "slack" as const;
  private slackApp: App;
  private gateway: ChatGateway;

  constructor(slackApp: App, gateway: ChatGateway) {
    this.slackApp = slackApp;
    this.gateway = gateway;
  }

  /**
   * Initialize the Slack adapter with event listeners
   */
  async initialize(): Promise<void> {
    this.slackApp.message(this.handleMessage.bind(this));
    console.log("Slack adapter initialized");
  }

  /**
   * Handle incoming messages from Slack
   */
  private async handleMessage({
    message,
    say,
    client,
  }: {
    message: GenericMessageEvent;
    say: (message: string) => Promise<void>;
    client: any;
  }): Promise<void> {
    try {
      if (message.type !== "message" || message.subtype) {
        return;
      }

      let text = (message as any).text;

      if (!text) {
        return;
      }

      // Remove bot mention from the text (e.g., "<@U123456> hello" -> "hello")
      text = text.replace(/<@U[A-Z0-9]+>\s*/g, "").trim();

      if (!text) {
        return;
      }

      // Get user info for better context
      let userId = message.user || "slack-unknown";
      let username = "Unknown";

      try {
        if (message.user) {
          const userInfo = await client.users.info({ user: message.user });
          username = userInfo.user?.name || message.user;
        }
      } catch (error) {
        console.warn("Failed to get Slack user info:", error);
      }

      // Prepare message for gateway
      const platformMessage = {
        text,
        userId,
        tenantId: "default", // Can be extracted from channel or team ID
        metadata: {
          channelId: message.channel,
          threadId: message.thread_ts,
          timestamp: message.ts,
          username,
          team: (this.slackApp as any).client?.teamId,
        },
      };

      // Process through gateway
      const response = await this.gateway.processMessage(
        platformMessage,
        "slack"
      );

      // Send response back to Slack
      if (response.success) {
        await say(response.response);
      } else {
        await say(`Error: ${response.response}`);
      }
    } catch (error) {
      console.error("Slack adapter error:", error);
      try {
        await say("Sorry, I encountered an error processing your message.");
      } catch (e) {
        console.error("Failed to send error message to Slack:", e);
      }
    }
  }

  /**
   * Process message (required by GatewayAdapter interface)
   */
  async processMessage(message: any): Promise<void> {
    // Used for programmatic message processing
    await this.gateway.processMessage(message, "slack");
  }
}

/**
 * Legacy function for backwards compatibility
 */
export function setupSlackAdapter(slackApp: App, gateway: ChatGateway) {
  const slackAdapter = new SlackAdapter(slackApp, gateway);
  return slackAdapter.initialize();
}

