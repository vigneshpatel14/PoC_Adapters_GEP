# Chat Gateway PoC - Multi-Channel Agent Architecture

A minimal but complete proof-of-concept demonstrating a chat gateway that orchestrates multiple platform adapters (Slack, Web, Discord) with session management, message normalization, and multi-tenant support.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLATFORM LAYER                              │
├──────────────┬──────────────────────┬──────────────┬────────────┤
│              │                      │              │            │
│  Web Browser │   Slack Workspace    │  Discord Bot │   Teams    │
│              │   (Socket Mode)      │  (Future)    │ (Future)   │
└──────┬───────┴──────────┬───────────┴──────┬───────┴────┬───────┘
       │                  │                  │            │
       └──────────────────┴──────────────────┴────────────┘
                          │
                ┌─────────▼─────────┐
                │   HTTP / Events   │
                └─────────┬─────────┘
                          │
                ┌─────────▼──────────────────────────────┐
                │    CHAT GATEWAY (Orchestrator)          │
                │                                        │
                │  • Message Normalizer                   │
                │  • Session Manager                      │
                │  • Tenant Config Loader                 │
                │  • Agent Invoker                        │
                │  • Main Gateway (Orchestrator)          │
                │                                        │
                └────────────────┬─────────────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   POST /api/chat       │
                    │   {message data}       │
                    └────────────┬───────────┘
                                 │
                ┌────────────────▼──────────────┐
                │    AGENT PLATFORM              │
                │    - Process message           │
                │    - Generate response         │
                └───────────────────────────────┘
```

## Project Structure

```
multi-channel-poc/
├── backend/
│   ├── src/
│   │   ├── agent.ts                 # Agent brain (process logic)
│   │   ├── server.ts                # Express + Slack initialization
│   │   ├── types.ts                 # Original types
│   │   │
│   │   ├── gateway/                 # Chat Gateway components
│   │   │   ├── types.ts             # Gateway interfaces
│   │   │   ├── gateway.ts           # Main orchestrator
│   │   │   ├── session-manager.ts   # Session lifecycle
│   │   │   ├── normalizer.ts        # Message normalization
│   │   │   ├── tenant-config.ts     # Multi-tenant config
│   │   │   └── invoker.ts           # Agent invocation
│   │   │
│   │   └── adapters/                # Platform adapters
│   │       ├── web-adapter.ts       # HTTP endpoint adapter
│   │       ├── slack-adapter.ts     # Slack Socket Mode adapter
│   │       └── discord-adapter.ts   # Discord adapter (placeholder)
│   │
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Main chat UI (enhanced)
│   │   │   └── ChatInterface.css    # Chat styles
│   │   │
│   │   ├── api/
│   │   │   └── agent.ts             # API client (gateway-aware)
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Core Gateway Components

### 1. Message Normalizer
Converts platform-specific messages to a unified format:

```typescript
interface UnifiedMessage {
  id: string;
  userId: string;
  sessionId: string;
  tenantId: string;
  platform: "web" | "slack" | "discord" | "teams";
  text: string;
  metadata?: Record<string, any>;
}
```

**Features**:
- Normalizes Web, Slack, and Discord message formats
- Strips bot mentions from Slack messages
- Generates unique message IDs
- Validates normalized messages

### 2. Session Manager
Manages user sessions across adapters:

**Features**:
- In-memory session storage
- Automatic session creation/retrieval
- 24-hour session timeout with auto-cleanup
- Tenant-scoped queries
- Session metadata tracking

### 3. Tenant Config Loader
Manages multi-tenant configuration:

**Features**:
- Load default tenant from environment
- Support for additional tenants via JSON
- Per-tenant credentials and endpoints
- Tenant validation

### 4. Agent Invoker
HTTP client for calling the agent platform:

**Features**:
- HTTP POST to agent endpoint
- Retry logic with exponential backoff
- Timeout handling
- Health check support

### 5. Chat Gateway
Main orchestrator coordinating all components:

**Key Methods**:
- `processMessage()` - Main entry point
- `registerAdapter()` - Register platform adapters
- `getSession()` / `listSessions()` - Session queries
- `getTenant()` / `registerTenant()` - Tenant management
- `healthCheck()` - System health status

## Platform Adapters

### Web Adapter
HTTP endpoint for web clients

```bash
POST /api/chat
{
  "message": "hello",
  "userId": "web-user-123",
  "sessionId": "sess-abc123",
  "tenantId": "default"
}

Response:
{
  "success": true,
  "response": "Hello! How can I help you?",
  "sessionId": "sess-abc123"
}
```

**Endpoints**:
- `POST /api/chat` - Send message
- `GET /api/session/:sessionId` - Get session details
- `GET /api/sessions` - List all sessions
- `GET /health` - Health check

### Slack Adapter
Slack Socket Mode integration:

**Features**:
- Listens for mentions and direct messages
- Strips bot mention from message text
- Retrieves user information from Slack
- Thread awareness
- Sends responses directly to Slack

### Discord Adapter
Placeholder for Discord integration showing extensibility

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Slack Bot Token and App Token (optional, for Slack integration)

### 1. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Server
PORT=3000

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_APP_TOKEN=xapp-your-token
SLACK_SIGNING_SECRET=your-secret
SLACK_PORT=3001

# Agent
AGENT_INVOKE_URL=http://localhost:3000/api/chat
```

Start backend:

```bash
npm run dev
# or
npm start
```

Backend will run on `http://localhost:3000`

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Test the Gateway

#### Via Web Interface

1. Open `http://localhost:5173` in browser
2. Click "⚙️ Settings" to view/edit tenant and session info
3. Type a message and send
4. Check session stats with "Fetch Stats" button

#### Via cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hello",
    "userId": "user-123",
    "tenantId": "default"
  }'
```

#### Via Slack

1. Set up Slack bot with Socket Mode enabled
2. Add `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_SIGNING_SECRET` to `.env`
3. Invite bot to channel: `@your-bot-name hello`
4. Bot responds through gateway

## Message Flow

### Web Browser Flow

```
User types "hello" in web UI
        ↓
Web Adapter receives HTTP POST /api/chat
        ↓
Gateway.processMessage() called
        ↓
MessageNormalizer converts to UnifiedMessage
        ↓
SessionManager creates/retrieves session
        ↓
TenantConfigLoader loads "default" tenant config
        ↓
AgentInvoker posts to /api/chat (agent endpoint)
        ↓
Agent responds with "Hello! How can I help?"
        ↓
Response returned to Web Adapter
        ↓
Frontend receives response, displays in UI
        ↓
Session updated with metadata
```

### Slack Flow

```
User mentions bot in Slack: "@bot hello"
        ↓
Slack Socket Mode sends event to SlackAdapter
        ↓
SlackAdapter.handleMessage() strips mention
        ↓
Gateway.processMessage() called with platform: "slack"
        ↓
MessageNormalizer converts Slack event to UnifiedMessage
        ↓
SessionManager creates session scoped to Slack user
        ↓
AgentInvoker calls agent platform
        ↓
Agent responds
        ↓
SlackAdapter sends response back to Slack channel
        ↓
Session metadata updated
```

## Key Features

✅ **Multi-Channel Support**
- Web (HTTP)
- Slack (Socket Mode - no ngrok needed)
- Discord (extensible structure)

✅ **Session Management**
- Automatic session creation per user
- 24-hour session timeout
- Tenant-scoped sessions
- Metadata tracking

✅ **Message Normalization**
- Platform-agnostic message format
- Bot mention handling
- Metadata preservation
- Message validation

✅ **Multi-Tenant Support**
- Tenant-based configuration
- Per-tenant credentials
- Per-tenant agent endpoints
- Environment or JSON-based config

✅ **Clean Architecture**
- Adapter Pattern for platforms
- Separation of concerns
- Type-safe interfaces
- Minimal dependencies

## Configuration Examples

### Single Tenant (Default)

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
AGENT_INVOKE_URL=http://localhost:3000/api/chat
```

### Multi-Tenant

```env
TENANTS_JSON='[
  {
    "tenantId": "acme",
    "name": "ACME Corp",
    "slack": { "botToken": "xoxb-acme", "appToken": "xapp-acme", "enabled": true },
    "agentConfig": { "invokeUrl": "http://agent-acme:3000/api/chat" }
  },
  {
    "tenantId": "widgets",
    "name": "Widgets Inc",
    "web": { "enabled": true },
    "agentConfig": { "invokeUrl": "http://agent-widgets:3000/api/chat" }
  }
]'
```

## API Reference

### Send Message

```
POST /api/chat
Content-Type: application/json

{
  "message": "hello",
  "userId": "user-123",       # optional
  "sessionId": "sess-456",    # optional
  "tenantId": "default"       # optional, defaults to "default"
}

Response:
{
  "success": true,
  "response": "Hello! How can I help?",
  "sessionId": "sess-456"
}
```

### Get Session

```
GET /api/session/:sessionId

Response:
{
  "sessionId": "sess-456",
  "userId": "user-123",
  "tenantId": "default",
  "platform": "web",
  "createdAt": 1234567890,
  "lastActivity": 1234567890,
  "metadata": { ... }
}
```

### List Sessions

```
GET /api/sessions?tenantId=default

Response:
[
  { sessionId, userId, tenantId, platform, createdAt, lastActivity, ... },
  ...
]
```

### Health Check

```
GET /health

Response:
{
  "status": "healthy",
  "adapters": ["web", "slack"],
  "tenants": ["default"],
  "agentHealth": { "default": true }
}
```

## Extending the Gateway

### Adding a New Platform Adapter

1. Create adapter class implementing `GatewayAdapter` interface
2. Register in `server.ts`
3. Add platform to `UnifiedMessage.platform` type

### Adding a New Tenant

```typescript
gateway.registerTenant({
  tenantId: "new-tenant",
  name: "New Tenant",
  web: { enabled: true },
  agentConfig: {
    invokeUrl: "http://agent:3000/api/chat",
    timeout: 30000
  }
});
```

## Troubleshooting

### Slack Bot Not Responding

- Verify `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env`
- Check bot is invited to channel
- Verify Socket Mode is enabled in Slack App settings

### Web Messages Not Working

- Check backend running on port 3000
- Verify frontend connecting to correct backend URL
- Check browser console for CORS errors

### Sessions Not Persisting

- Sessions are in-memory (cleared on server restart)
- Use database adapter for persistent sessions

### Agent Endpoint Issues

- Verify agent is running and accessible
- Check health endpoint: `GET /health`

## Technology Stack

- **Backend**: TypeScript, Express.js, @slack/bolt (Socket Mode), Axios
- **Frontend**: React 18, Vite 5, Axios
- **Message Format**: Universal message interface (JSON)
- **Session Store**: In-memory with 24-hour expiration
- **Multi-tenancy**: Configuration-based with environment variables

## Future Enhancements

- [ ] Persistent session storage (database)
- [ ] Message history logging
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Full Discord.js implementation
- [ ] Microsoft Teams integration
- [ ] Analytics and metrics

## License

MIT

---

**A minimal but working Chat Gateway PoC showing clean multi-channel architecture.** 🚀
