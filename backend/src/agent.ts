import { UniversalMessage, UniversalResponse } from "./types";

export class Agent {
  process(message: UniversalMessage): UniversalResponse {
    const text = message.text.toLowerCase().trim();

    if (text === "hello") {
      return {
        text: "Hi! I'm your PoC agent.",
        platform: message.platform,
      };
    }

    if (text === "help") {
      return {
        text: "I support multiple channels like web and Slack.",
        platform: message.platform,
      };
    }

    return {
      text: `You said: ${message.text}`,
      platform: message.platform,
    };
  }
}
