# Quick Start Commands

## Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd frontend
npm install
```

## Run the PoC

### Terminal 1: Backend
```powershell
cd backend
npm run dev
```

Expected: `✓ Backend server running on http://localhost:3000`

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Expected: Browser opens to `http://localhost:5173/`

## Test It

### Web Chat
1. Type "hello" in the chat UI
2. Agent replies: "Hi! I'm your PoC agent."
3. Type "help"
4. Agent replies: "I support multiple channels like web and Slack."
5. Type anything else (e.g., "test")
6. Agent replies: "You said: test"

### Slack (Optional)
See `SLACK_SETUP.md` for full setup. Quick version:

```powershell
# Set tokens
$env:SLACK_BOT_TOKEN = "xoxb-..."
$env:SLACK_SIGNING_SECRET = "..."

# In another terminal, expose port 3001
ngrok http 3001

# Backend auto-starts Slack listener on port 3001
cd backend
npm run dev
```

Then message your bot in Slack with same test inputs.

---

## Project Files

### Backend
- `src/agent.ts` - Central agent logic (the "brain")
- `src/types.ts` - Universal message format
- `src/adapters/web-adapter.ts` - Express endpoint
- `src/adapters/slack-adapter.ts` - Slack Bolt handler
- `src/server.ts` - Server entry point

### Frontend
- `src/components/ChatInterface.tsx` - Chat UI component
- `src/api/agent.ts` - API client
- `src/App.tsx` - Main React component
- `src/main.tsx` - Entry point
- `vite.config.ts` - Vite configuration

---

## Architecture Proof

The PoC proves:

1. **Same agent processes all channels**
   - Web chat → `agent.process()`
   - Slack → `agent.process()`
   - Both use exact same method

2. **No logic duplication**
   - Agent logic written once in `agent.ts`
   - Both adapters just translate to/from `UniversalMessage`

3. **Minimal adapter pattern**
   - Web: ~20 lines
   - Slack: ~25 lines
   - Both delegate to agent

---

Done! The PoC is ready to run. 🚀
