import { Session } from "./types";

/**
 * Simple in-memory session manager
 * In production, this would use a database
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create or get a session
   */
  getOrCreateSession(
    userId: string,
    tenantId: string,
    platform: string,
    sessionId?: string
  ): Session {
    let sid = sessionId || `${tenantId}-${userId}-${platform}-${Date.now()}`;

    if (this.sessions.has(sid)) {
      const session = this.sessions.get(sid)!;
      session.lastActivity = Date.now();
      return session;
    }

    const session: Session = {
      sessionId: sid,
      userId,
      tenantId,
      platform,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {},
    };

    this.sessions.set(sid, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session metadata
   */
  updateSession(sessionId: string, metadata: Record<string, any>): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata = { ...session.metadata, ...metadata };
      session.lastActivity = Date.now();
    }
    return session;
  }

  /**
   * List all active sessions
   */
  listSessions(tenantId?: string): Session[] {
    const sessions = Array.from(this.sessions.values());

    // Clean up expired sessions
    const now = Date.now();
    sessions.forEach((session) => {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(session.sessionId);
      }
    });

    if (tenantId) {
      return sessions.filter((s) => s.tenantId === tenantId);
    }

    return sessions;
  }

  /**
   * Clear a session
   */
  clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.values()).map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        tenantId: s.tenantId,
        platform: s.platform,
        createdAt: new Date(s.createdAt).toISOString(),
        lastActivity: new Date(s.lastActivity).toISOString(),
      })),
    };
  }
}
