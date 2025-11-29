/**
 * Unified message format for all adapters
 * All platform-specific messages are normalized to this format
 */
export interface UnifiedMessage {
  id: string;
  userId: string;
  sessionId: string;
  tenantId: string;
  platform: "web" | "slack" | "discord" | "teams";
  text: string;
  metadata?: {
    channelId?: string;
    threadId?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

/**
 * Response from Agent Platform
 */
export interface AgentResponse {
  success: boolean;
  response: string;
  sessionId: string;
  [key: string]: any;
}

/**
 * Session data stored in memory
 */
export interface Session {
  sessionId: string;
  userId: string;
  tenantId: string;
  platform: string;
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

/**
 * Tenant configuration
 */
export interface TenantConfig {
  tenantId: string;
  name: string;
  slack?: {
    botToken: string;
    appToken: string;
    signingSecret: string;
    enabled: boolean;
  };
  web?: {
    enabled: boolean;
  };
  discord?: {
    token?: string;
    enabled: boolean;
  };
  agentConfig?: {
    invokeUrl: string;
    timeout: number;
  };
}

/**
 * Gateway event
 */
export interface GatewayEvent {
  type: "message" | "action" | "command";
  platform: string;
  data: any;
}

/**
 * Gateway adapter interface
 * All platform adapters must implement this interface
 */
export interface GatewayAdapter {
  name: string;
  platform: "web" | "slack" | "discord" | "teams";
  processMessage(message: any): Promise<void>;
  initialize?(): Promise<void>;
}
