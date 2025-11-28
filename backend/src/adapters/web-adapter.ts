import { Express } from "express";
import { Agent } from "../agent";
import { UniversalMessage } from "../types";

export function setupWebAdapter(app: Express, agent: Agent) {
  app.post("/api/chat", (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const universalMessage: UniversalMessage = {
      text: message,
      user: { id: "web-user-" + Date.now() },
      platform: "web",
    };

    const response = agent.process(universalMessage);

    res.json({ response: response.text });
  });
}
