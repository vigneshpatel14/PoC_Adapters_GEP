import { App } from "@slack/bolt";
import { Agent } from "../agent";
import { UniversalMessage } from "../types";

export function setupSlackAdapter(slackApp: App, agent: Agent) {
  slackApp.message(async ({ message, say }) => {
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

    const universalMessage: UniversalMessage = {
      text,
      user: { id: message.user || "unknown" },
      platform: "slack",
    };

    const response = agent.process(universalMessage);

    await say(response.text);
  });
}

