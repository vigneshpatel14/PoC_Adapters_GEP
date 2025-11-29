import axios from "axios";

const API_BASE = "http://localhost:3000";

/**
 * Response from the gateway
 */
export interface GatewayResponse {
  success: boolean;
  response: string;
  sessionId: string;
  [key: string]: any;
}

/**
 * Send a message through the chat gateway
 */
export async function sendMessage(
  message: string,
  userId?: string,
  sessionId?: string,
  tenantId?: string
): Promise<GatewayResponse> {
  const response = await axios.post(`${API_BASE}/api/chat`, {
    message,
    userId,
    sessionId,
    tenantId: tenantId || "default",
  });

  // Normalize response format
  if (response.data.response !== undefined) {
    return response.data;
  }

  // Fallback if response structure is different
  return {
    success: true,
    response: response.data.response || response.data,
    sessionId: sessionId || "",
  };
}

/**
 * Get session information
 */
export async function getSession(sessionId: string): Promise<any> {
  const response = await axios.get(`${API_BASE}/api/session/${sessionId}`);
  return response.data;
}

/**
 * List all sessions
 */
export async function listSessions(tenantId?: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/api/sessions`, {
    params: { tenantId },
  });
  return response.data;
}

/**
 * Get gateway health status
 */
export async function getHealth(): Promise<any> {
  const response = await axios.get(`${API_BASE}/health`);
  return response.data;
}
