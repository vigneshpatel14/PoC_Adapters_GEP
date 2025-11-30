import { Express } from "express";
import { ChatGateway } from "../gateway/gateway";
import { GatewayAdapter } from "../gateway/types";

/**
 * Web Adapter - Handles HTTP requests from web clients
 * Integrates with the Chat Gateway
 */
export class WebAdapter implements GatewayAdapter {
  name = "web";
  platform = "web" as const;
  private gateway: ChatGateway;
  private app: Express;

  constructor(app: Express, gateway: ChatGateway) {
    this.app = app;
    this.gateway = gateway;
  }

  /**
   * Initialize the web adapter with Express routes
   */
  async initialize(): Promise<void> {
    this.app.post("/api/chat", this.handleMessage.bind(this));
    this.app.post("/api/agent", this.handleAgentRequest.bind(this));
    this.app.get("/api/session/:sessionId", this.getSession.bind(this));
    this.app.get("/api/sessions", this.listSessions.bind(this));
    this.app.get("/health", this.healthCheck.bind(this));
    console.log("Web adapter initialized");
  }

  /**
   * Handle incoming chat message from web
   */
  private async handleMessage(req: any, res: any) {
    try {
      const { message, userId, sessionId, tenantId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Prepare message for gateway
      const platformMessage = {
        text: message,
        userId: userId || `web-user-${Date.now()}`,
        sessionId,
        tenantId: tenantId || "default",
        metadata: {
          timestamp: Date.now(),
          ip: req.ip,
        },
      };

      // Process through gateway
      const response = await this.gateway.processMessage(
        platformMessage,
        "web"
      );

      res.json(response);
    } catch (error) {
      console.error("Web adapter error:", error);
      res.status(500).json({
        success: false,
        response: "Internal server error",
        sessionId: req.body.sessionId,
      });
    }
  }

  /**
   * Internal agent endpoint for gateway invocation
   * Accepts unified message format for testing/internal use
   * Mock agent that echoes back responses for PoC testing
   */
  private async handleAgentRequest(req: any, res: any) {
    try {
      const { message, userId, tenantId, sessionId } = req.body;

      // Mock agent responses based on keywords
      let mockResponse = this.generateMockResponse(message, tenantId);

      res.json({
        response: mockResponse,
        success: true,
        sessionId: sessionId || "",
        agentType: "mock",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Agent endpoint error:", error);
      res.status(500).json({
        success: false,
        response: "Internal server error",
        sessionId: req.body.sessionId,
      });
    }
  }

  /**
   * Generate mock agent responses for different keywords
   * This is for PoC testing - replace with real agent later
   */
  private generateMockResponse(message: string, tenantId: string): string {
    const msg = message.toLowerCase();
    const tenant = tenantId || "default";

    // Mock responses for common queries
    if (msg.includes("hello") || msg.includes("hi")) {
      return `Hello from tenant '${tenant}'! 👋 How can I help you today?`;
    }
    if (msg.includes("weather")) {
      return `The weather in ${tenant}'s region is sunny and 72°F. Have a great day! ☀️`;
    }
    if (msg.includes("time")) {
      return `Current time: ${new Date().toLocaleTimeString()}`;
    }
    if (msg.includes("help")) {
      return `I'm a mock agent for PoC testing. Try asking me about: weather, time, or just say hello! 💬`;
    }
    if (msg.includes("who are you")) {
      return `I'm a mock Chat Gateway agent running on tenant '${tenant}'. I'm here to demonstrate multi-tenant, multi-channel message processing! 🚀`;
    }
    if (msg.includes("tenant")) {
      return `You're currently using tenant: '${tenant}'. All your sessions and data are isolated per tenant. 🔒`;
    }

    // Default response
    return `Mock agent response for tenant '${tenant}': You said "${message}". This is a PoC mock agent - connect a real agent to production! 🤖`;
  }

  /**
   * Get session information
   */
  private getSession(req: any, res: any) {
    const { sessionId } = req.params;
    const session = this.gateway.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  }

  /**
   * List all sessions
   */
  private listSessions(req: any, res: any) {
    const { tenantId } = req.query;
    const sessions = this.gateway.listSessions(tenantId);
    res.json(sessions);
  }

  /**
   * Health check endpoint
   */
  private async healthCheck(req: any, res: any) {
    const health = await this.gateway.healthCheck();
    res.json(health);
  }

  /**
   * Process message (required by GatewayAdapter interface)
   */
  async processMessage(message: any): Promise<void> {
    // Used for programmatic message processing
    await this.gateway.processMessage(message, "web");
  }
}

/**
 * Legacy function for backwards compatibility
 */
export function setupWebAdapter(app: Express, gateway: ChatGateway) {
  const webAdapter = new WebAdapter(app, gateway);
  return webAdapter.initialize();
}
