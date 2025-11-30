import { useState, useEffect } from "react";
import { sendMessage, GatewayResponse } from "../api/agent";
import "./ChatInterface.css";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp?: number;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [tenantId, setTenantId] = useState("default");
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStats, setSessionStats] = useState<string>("");

  // Initialize user and session on mount
  useEffect(() => {
    const storedUserId =
      localStorage.getItem("userId") || `web-user-${Date.now()}`;
    const storedSessionId = localStorage.getItem("sessionId") || "";

    setUserId(storedUserId);
    setSessionId(storedSessionId);
    localStorage.setItem("userId", storedUserId);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response: GatewayResponse = await sendMessage(
        input,
        userId,
        sessionId,
        tenantId
      );

      // Update session ID if provided in response
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem("sessionId", response.sessionId);
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: response.response || "No response",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: `Error: ${error instanceof Error ? error.message : "Could not reach agent"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setSessionId("");
    localStorage.removeItem("sessionId");
  };

  const fetchSessionStats = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/sessions?tenantId=${tenantId}`
      );
      const data = await response.json();
      setSessionStats(JSON.stringify(data, null, 2));
    } catch (error) {
      setSessionStats(
        `Error fetching stats: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat Gateway PoC</h1>
        <p>Web Chat Interface with Session Management</p>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="setting-group">
            <label htmlFor="tenant">Tenant ID:</label>
            <input
              id="tenant"
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="default"
              title="Tenant ID for multi-tenant support"
            />
          </div>
          <div className="setting-group">
            <label htmlFor="userid">User ID:</label>
            <input
              id="userid"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="web-user-..."
              title="User ID - edit to test different users"
            />
          </div>
          <div className="setting-group">
            <label htmlFor="sessionid">Session ID:</label>
            <input
              id="sessionid"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="auto-generated"
              title="Session ID for tracking conversation"
            />
          </div>
          <div className="setting-group">
            <button onClick={clearHistory} className="btn-secondary">
              Clear History
            </button>
            <button onClick={fetchSessionStats} className="btn-secondary">
              Fetch Stats
            </button>
          </div>
          {sessionStats && (
            <div className="stats-display">
              <h4>Session Stats:</h4>
              <pre>{sessionStats}</pre>
            </div>
          )}
        </div>
      )}

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start a conversation with the agent</p>
            <p className="empty-hint">
              Try: "hello", "help", or anything else
            </p>
            {sessionId && (
              <p className="empty-session">Session: {sessionId}</p>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.text}</div>
            {msg.timestamp && (
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
          title="Chat input"
        />
        <button onClick={handleSend} disabled={loading} title="Send message">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
