import axios, { AxiosInstance } from "axios";
import { UnifiedMessage, AgentResponse } from "./types";

/**
 * Outbound invoker for calling the agent platform
 * Handles HTTP communication with the agent service
 */
export class AgentInvoker {
  private client: AxiosInstance;
  private invokeUrl: string;
  private timeout: number;

  constructor(invokeUrl: string, timeout: number = 30000) {
    this.invokeUrl = invokeUrl;
    this.timeout = timeout;
    this.client = axios.create({
      timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Invoke the agent with a unified message
   * Returns the agent's response
   */
  async invoke(message: UnifiedMessage): Promise<AgentResponse> {
    try {
      const response = await this.client.post(this.invokeUrl, {
        text: message.text,
        platform: message.platform,
        userId: message.userId,
        sessionId: message.sessionId,
        tenantId: message.tenantId,
        metadata: message.metadata,
      });

      // Normalize response format
      return {
        success: true,
        response: response.data.response || response.data.text || response.data,
        sessionId: message.sessionId,
      };
    } catch (error) {
      console.error("Agent invocation failed:", error);

      // Return error response
      return {
        success: false,
        response:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Agent service error",
        sessionId: message.sessionId,
      };
    }
  }

  /**
   * Invoke with retry logic
   */
  async invokeWithRetry(
    message: UnifiedMessage,
    maxRetries: number = 2
  ): Promise<AgentResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.invoke(message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          console.log(
            `Retry attempt ${attempt + 1}/${maxRetries} for message ${message.id}`
          );
          // Exponential backoff: 100ms, 200ms
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt))
          );
        }
      }
    }

    // All retries failed
    return {
      success: false,
      response: `Agent invocation failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
      sessionId: message.sessionId,
    };
  }

  /**
   * Health check for agent service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to call the invoke endpoint with minimal data
      await this.client.post(this.invokeUrl, {
        text: "ping",
        platform: "gateway",
      });
      return true;
    } catch (error) {
      console.error("Agent health check failed:", error);
      return false;
    }
  }

  /**
   * Update invoke URL
   */
  setInvokeUrl(url: string): void {
    this.invokeUrl = url;
  }

  /**
   * Update timeout
   */
  setTimeout(timeoutMs: number): void {
    this.timeout = timeoutMs;
    this.client = axios.create({
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
