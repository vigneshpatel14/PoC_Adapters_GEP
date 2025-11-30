import { UnifiedMessage } from "./types";

/**
 * Generates a simple UUID-like ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Normalizes platform-specific messages to unified format
 */
export class MessageNormalizer {
  /**
   * Normalize web message
   */
  static normalizeWeb(
    text: string,
    userId: string,
    sessionId: string,
    tenantId: string,
    metadata?: any
  ): UnifiedMessage {
    return {
      id: generateId(),
      userId,
      sessionId,
      tenantId,
      platform: "web",
      text: text.trim(),
      metadata: {
        timestamp: Date.now(),
        ...metadata,
      },
    };
  }

  /**
   * Normalize Slack message
   */
  static normalizeSlack(
    text: string,
    userId: string,
    sessionId: string,
    tenantId: string,
    metadata?: any
  ): UnifiedMessage {
    // Remove bot mentions from text
    const cleanText = text.replace(/<@U[A-Z0-9]+>\s*/g, "").trim();

    return {
      id: generateId(),
      userId,
      sessionId,
      tenantId,
      platform: "slack",
      text: cleanText,
      metadata: {
        channelId: metadata?.channelId,
        threadId: metadata?.threadId,
        timestamp: Date.now(),
        ...metadata,
      },
    };
  }

  /**
   * Normalize Discord message
   */
  static normalizeDiscord(
    text: string,
    userId: string,
    sessionId: string,
    tenantId: string,
    channelId: string,
    guildId: string,
    metadata?: any
  ): UnifiedMessage {
    return {
      id: generateId(),
      userId,
      sessionId,
      tenantId,
      platform: "discord",
      text: text.trim(),
      metadata: {
        channelId,
        guildId,
        timestamp: Date.now(),
        ...metadata,
      },
    };
  }

  /**
   * Validate unified message
   */
  static validate(msg: UnifiedMessage): boolean {
    return (
      !!msg.id &&
      !!msg.userId &&
      !!msg.tenantId &&
      !!msg.platform &&
      !!msg.text
      // sessionId is optional at validation time - it will be assigned from session manager
    );
  }
}
