import { GatewayAdapter } from "./types";
import { SessionManager } from "./session-manager";
import { MessageNormalizer } from "./normalizer";
import { AgentInvoker } from "./invoker";
import { TenantConfigLoader } from "./tenant-config";
import { UnifiedMessage, AgentResponse, TenantConfig } from "./types";

/**
 * Main Chat Gateway
 * Orchestrates adapters, session management, message normalization, and agent invocation
 */
export class ChatGateway {
  private adapters: Map<string, GatewayAdapter> = new Map();
  private sessionManager: SessionManager;
  private normalizer: MessageNormalizer;
  private invokers: Map<string, AgentInvoker> = new Map();
  private tenantConfig: TenantConfigLoader;

  constructor() {
    this.sessionManager = new SessionManager();
    this.normalizer = new MessageNormalizer();
    this.tenantConfig = new TenantConfigLoader();

    // Initialize invoker for each tenant
    this.initializeInvokers();
  }

  /**
   * Initialize invokers for all tenants
   */
  private initializeInvokers(): void {
    const tenants = this.tenantConfig.getAllTenants();
    tenants.forEach((tenant) => {
      const invokeUrl = tenant.agentConfig?.invokeUrl || "http://localhost:3000/api/chat";
      const timeout = tenant.agentConfig?.timeout || 30000;
      const invoker = new AgentInvoker(invokeUrl, timeout);
      this.invokers.set(tenant.tenantId, invoker);
    });
  }

  /**
   * Register an adapter (e.g., Slack, Web, Discord)
   */
  registerAdapter(name: string, adapter: GatewayAdapter): void {
    this.adapters.set(name, adapter);
    console.log(`Gateway: Registered adapter '${name}'`);
  }

  /**
   * Get registered adapter
   */
  getAdapter(name: string): GatewayAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * List all registered adapters
   */
  listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Process an incoming message from any adapter
   * Main entry point for the gateway
   */
  async processMessage(
    platformMessage: any,
    platform: "web" | "slack" | "discord"
  ): Promise<AgentResponse> {
    try {
      // Extract tenant ID from message or use default
      const tenantId = platformMessage.tenantId || "default";

      // Validate tenant exists
      if (!this.tenantConfig.validateTenant(tenantId)) {
        return {
          success: false,
          response: `Invalid tenant: ${tenantId}`,
          sessionId: platformMessage.sessionId || "unknown",
        };
      }

      // Normalize the message
      let normalizedMessage: UnifiedMessage;
      switch (platform) {
        case "web":
          normalizedMessage = MessageNormalizer.normalizeWeb(
            platformMessage.text,
            platformMessage.userId || `web-user-${Date.now()}`,
            platformMessage.sessionId || "",
            tenantId,
            platformMessage.metadata
          );
          break;
        case "slack":
          normalizedMessage = MessageNormalizer.normalizeSlack(
            platformMessage.text,
            platformMessage.userId,
            platformMessage.sessionId || "",
            tenantId,
            platformMessage.metadata
          );
          break;
        case "discord":
          normalizedMessage = MessageNormalizer.normalizeDiscord(
            platformMessage.text,
            platformMessage.userId,
            platformMessage.sessionId || "",
            tenantId,
            platformMessage.metadata?.channelId || "",
            platformMessage.metadata?.guildId || "",
            platformMessage.metadata
          );
          break;
        default:
          return {
            success: false,
            response: `Unsupported platform: ${platform}`,
            sessionId: platformMessage.sessionId || "unknown",
          };
      }

      // Validate normalized message
      if (!MessageNormalizer.validate(normalizedMessage)) {
        return {
          success: false,
          response: "Failed to normalize message",
          sessionId: normalizedMessage.sessionId,
        };
      }

      // Get or create session
      const session = this.sessionManager.getOrCreateSession(
        normalizedMessage.userId,
        tenantId,
        platform
      );
      normalizedMessage.sessionId = session.sessionId;

      // Invoke the agent
      const invoker = this.invokers.get(tenantId);
      if (!invoker) {
        return {
          success: false,
          response: `No invoker configured for tenant: ${tenantId}`,
          sessionId: normalizedMessage.sessionId,
        };
      }

      const agentResponse = await invoker.invoke(normalizedMessage);

      // Update session with new metadata
      this.sessionManager.updateSession(session.sessionId, {
        lastMessageTime: new Date(),
        lastPlatform: platform,
      });

      return agentResponse;
    } catch (error) {
      console.error("Gateway processing error:", error);
      return {
        success: false,
        response: `Gateway error: ${error instanceof Error ? error.message : "Unknown error"}`,
        sessionId: platformMessage.sessionId || "unknown",
      };
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string) {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(tenantId?: string) {
    return this.sessionManager.listSessions(tenantId);
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return this.sessionManager.getStats();
  }

  /**
   * Get tenant configuration
   */
  getTenant(tenantId: string): TenantConfig | undefined {
    return this.tenantConfig.getTenant(tenantId);
  }

  /**
   * List all configured tenants
   */
  listTenants(): string[] {
    return this.tenantConfig.listTenantIds();
  }

  /**
   * Register a new tenant at runtime
   */
  registerTenant(config: TenantConfig): void {
    this.tenantConfig.registerTenant(config);

    // Create invoker for new tenant
    const invokeUrl = config.agentConfig?.invokeUrl || "http://localhost:3000/api/chat";
    const timeout = config.agentConfig?.timeout || 30000;
    const invoker = new AgentInvoker(invokeUrl, timeout);
    this.invokers.set(config.tenantId, invoker);

    console.log(`Gateway: Registered tenant '${config.tenantId}'`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    adapters: string[];
    tenants: string[];
    agentHealth: Record<string, boolean>;
  }> {
    const agentHealth: Record<string, boolean> = {};
    const tenantIds = this.tenantConfig.listTenantIds();

    for (const tenantId of tenantIds) {
      const invoker = this.invokers.get(tenantId);
      if (invoker) {
        agentHealth[tenantId] = await invoker.healthCheck();
      }
    }

    const allHealthy = Object.values(agentHealth).every((v) => v === true);
    const anyHealthy = Object.values(agentHealth).some((v) => v === true);

    return {
      status: allHealthy ? "healthy" : anyHealthy ? "degraded" : "unhealthy",
      adapters: this.listAdapters(),
      tenants: tenantIds,
      agentHealth,
    };
  }
}

// Global instance
export const gateway = new ChatGateway();
