# Multi-Channel Agent PoC

A minimal proof of concept demonstrating a centralized agent brain that handles messages from multiple platforms (Web Chat and Slack) without duplicating logic.

## Project Structure

```
multi-channel-poc/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express + Slack app setup
│   │   ├── agent.ts            # Central agent logic
│   │   ├── types.ts            # Universal message types
│   │   └── adapters/
│   │       ├── web-adapter.ts  # Express route adapter
│   │       └── slack-adapter.ts # Slack Bolt adapter
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx            # React entry point
    │   ├── App.tsx
    │   ├── index.css
    │   ├── App.css
    │   ├── components/
    │   │   ├── ChatInterface.tsx
    │   │   └── ChatInterface.css
    │   └── api/
    │       └── agent.ts        # API client
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── package.json
```

## Architecture Overview

### Central Agent (One Brain, All Channels)

The `Agent` class in `src/agent.ts` implements simple logic:

- **"hello"** → "Hi! I'm your PoC agent."
- **"help"** → "I support multiple channels like web and Slack."
- **Anything else** → "You said: {message}"

### Universal Message Format

Both Web and Slack channels convert platform-specific messages into a `UniversalMessage`:

```typescript
interface UniversalMessage {
  text: string;
  user: { id: string };
  platform: "web" | "slack";
}
```

### Adapters

**Web Adapter** (`web-adapter.ts`):
- Express route: `POST /api/chat`
- Converts request body → `UniversalMessage`
- Sends to agent
- Returns agent response as JSON

**Slack Adapter** (`slack-adapter.ts`):
- Uses `@slack/bolt`
- Listens to Slack message events
- Converts Slack event → `UniversalMessage`
- Sends to agent
- Posts response back to Slack channel via `say()`

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup Backend

```bash
cd backend
npm install
```

### Setup Frontend

```bash
cd frontend
npm install
```

## Running the PoC

### 1. Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Expected output:
```
✓ Backend server running on http://localhost:3000
✓ Web chat endpoint: POST http://localhost:3000/api/chat
⚠ Slack credentials not set. Slack bot will not start. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET to enable.
```

### 2. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 100 ms

➜  Local:   http://localhost:5173/
```

### 3. Test Web Chat

- Open `http://localhost:5173/` in browser
- Type "hello" → Agent responds: "Hi! I'm your PoC agent."
- Type "help" → Agent responds: "I support multiple channels like web and Slack."
- Type any other message → Agent echoes it back

## Running Slack Bot (Optional)

To enable Slack bot support, set environment variables:

```bash
$env:SLACK_BOT_TOKEN = "xoxb-your-token"
$env:SLACK_SIGNING_SECRET = "your-signing-secret"
$env:SLACK_PORT = "3001"
```

Then restart backend:

```bash
cd backend
npm run dev
```

## How It Works

### Web Flow

1. User types message in React UI
2. Frontend calls `POST /api/chat` with `{ message: "hello" }`
3. Web adapter converts to `UniversalMessage`
4. Agent processes it
5. Response returned to frontend as `{ response: "Hi! I'm your PoC agent." }`

### Slack Flow

1. User messages bot in Slack
2. Slack sends event to backend (via ngrok or public URL)
3. Slack adapter receives event
4. Converts to `UniversalMessage`
5. Agent processes it
6. Adapter posts response back to Slack channel

## Testing the PoC Locally

### Test Case 1: Web Chat

```
User: "hello"
Agent: "Hi! I'm your PoC agent."

User: "help"
Agent: "I support multiple channels like web and Slack."

User: "test message"
Agent: "You said: test message"
```

### Test Case 2: Slack (if configured)

Same messages → Same responses (proving shared agent logic)

## Key Features

✓ Single agent brain processes all channel messages  
✓ Universal message format shared across platforms  
✓ Platform-specific adapters (no logic duplication)  
✓ Simple Express backend  
✓ React chat UI  
✓ TypeScript throughout  
✓ No database, auth, or state management  
✓ Minimal, copy-paste runnable code  

## What's NOT Included

✗ Docker  
✗ Database  
✗ Authentication/OAuth  
✗ State management  
✗ Sessions  
✗ Logging libraries  
✗ Monitoring  
✗ Advanced Slack features (block-kit, threads)  
✗ Multiple user support  
✗ Background jobs  
✗ WebSocket support  

## Proof of Concept Goals

This PoC proves:

1. **Centralized Logic**: Both web and Slack messages hit the same `Agent.process()` method
2. **No Duplication**: Agent logic is written once, works everywhere
3. **Adapter Pattern**: Each platform has a minimal adapter that translates to/from universal format
4. **Minimal Setup**: Single files for each adapter, minimal configuration

---

## 🚀 Future Scope: Scaling to Multiple Platforms

### Adding New Adapters (Easy!)

This architecture makes it trivial to add new platforms. Here's what adding Discord would look like:

#### Step 1: Create Discord Adapter
```typescript
// backend/src/adapters/discord-adapter.ts
import { Client, Message } from 'discord.js';
import { Agent } from '../agent';
import { UniversalMessage } from '../types';

export function setupDiscordAdapter(discordClient: Client, agent: Agent) {
  discordClient.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    const universalMessage: UniversalMessage = {
      text: message.content,
      user: { id: message.author.id },
      platform: 'discord',
    };

    const response = agent.process(universalMessage);
    await message.reply(response.text);
  });
}
```

#### Step 2: Register in server.ts
```typescript
// Just add these lines
const discordClient = new Client({ intents: [GatewayIntentBits.MessageContent] });
setupDiscordAdapter(discordClient, agent);
await discordClient.login(process.env.DISCORD_TOKEN);
```

#### Step 3: Add Token to .env
```
DISCORD_TOKEN=your-discord-token
```

**That's it!** The entire `Agent` class remains unchanged. The same business logic now works on Discord too.

### Platforms You Can Add

Without changing the agent code, you can add:

✅ **Discord** - Gaming communities  
✅ **Microsoft Teams** - Enterprise  
✅ **WhatsApp** - Personal messaging  
✅ **Telegram** - Bots  
✅ **SMS/Twilio** - Text messages  
✅ **Email** - Automated responses  
✅ **Voice/Twilio** - Phone calls  
✅ **WebSocket** - Real-time connections  
✅ **GraphQL** - API calls  
✅ **REST APIs** - Third-party integrations  

Each needs only a tiny adapter. The agent logic is untouched.

---

## 💡 Why This Approach is Best

### 1. **Zero Logic Duplication**
```
Without this architecture:
- Web agent: 100 lines
- Slack agent: 100 lines
- Discord agent: 100 lines
- Teams agent: 100 lines
= 400 lines of duplicated logic

With adapter pattern:
- Agent: 100 lines (SHARED)
- Web adapter: 20 lines
- Slack adapter: 25 lines
- Discord adapter: 25 lines
- Teams adapter: 25 lines
= 195 total lines (51% less!)

More platforms = bigger savings
```

### 2. **Single Source of Truth**
When you fix a bug or add a feature, it works **everywhere**:
- Fix agent logic once
- All platforms instantly get the fix
- No need to update 4 different codebases

### 3. **Easy to Test**
```typescript
// Test agent ONCE
describe('Agent', () => {
  it('should respond to hello', () => {
    const msg = { text: 'hello', user: { id: '1' }, platform: 'web' };
    expect(agent.process(msg)).toEqual({ text: 'Hi! I\'m your PoC agent.', platform: 'web' });
  });
});

// All platforms inherit these tests automatically
```

### 4. **Consistent User Experience**
Same commands, same behavior everywhere:
- `hello` → same response on web, Slack, Discord, Teams, SMS
- `help` → same response everywhere
- User trains once, works everywhere

### 5. **Fast to Build**
New platform? Add an adapter in 30 minutes:
1. Learn platform's SDK (15 min)
2. Create adapter file (10 min)
3. Register in server (5 min)

Done!

### 6. **Easy to Maintain**
```
5 years later, you need to improve the agent:

Without adapters:
- Modify 4 different agent implementations
- Test each separately
- Deploy 4 times
- Risk of inconsistency

With adapters:
- Modify 1 agent file
- Test once
- Deploy once
- All platforms updated

= 75% less work
```

### 7. **Scalability Without Complexity**
Adding the 10th platform should be as easy as adding the 2nd:
- Still just one agent
- Just one more tiny adapter
- No architectural changes

### 8. **Clear Separation of Concerns**
```
Agent = Business Logic
├── What should the bot do?
├── How should it respond?
└── No platform knowledge

Adapters = Translation Layer
├── Web adapter: HTTP ↔ Universal
├── Slack adapter: Slack events ↔ Universal
├── Discord adapter: Discord events ↔ Universal
└── Each handles platform quirks
```

### 9. **Reduced Bugs and Issues**
```
Bug found in agent logic:
- Fix: 1 file
- Tests: 1 test suite
- Deployment: 1 backend restart
- Impact: All platforms fixed

Without adapters:
- Fix: 4 files
- Tests: 4 test suites
- Deployment: 4 backend restarts
- Risk: Inconsistent fixes across platforms

= 4x more error-prone
```

### 10. **Foundation for Growth**
Start simple, scale infinitely:
- Month 1: Web + Slack (this PoC)
- Month 2: Add Discord
- Month 3: Add Teams
- Month 6: Add 5 more platforms
- Year 1: Supporting 10+ platforms from single codebase

---

## 📊 Comparison: Adapter Pattern vs Traditional Approach

| Feature | Adapter Pattern | Traditional (Copy-Paste) |
|---------|-----------------|--------------------------|
| Code duplication | None | High (4x for 4 platforms) |
| Time to add platform | 30 min | 4 hours |
| Bug fix time | 5 min (1 file) | 20 min (4 files) |
| Testing | Once | 4 times |
| Maintenance cost | Low | Very High |
| Scalability | Unlimited | Degrades |
| Consistency | Guaranteed | At risk |
| Learning curve | Easy | Difficult |

---

## 🎯 Why This PoC Proves It Works

This minimal PoC demonstrates:

1. ✅ **Architecture is sound** - Both platforms use same agent
2. ✅ **No code duplication** - Agent written once
3. ✅ **Easy to extend** - Adapters are simple
4. ✅ **Type-safe** - Universal format enforced
5. ✅ **Production patterns** - Real code patterns, minimal scope
6. ✅ **Ready to scale** - Can easily add more platforms

---

## Build & Production

Not included in this PoC. This is for local development demonstration only.

## Support

This is a minimal PoC for architecture demonstration. For production, you would add:

- Error handling
- Input validation
- Logging
- Rate limiting
- Database
- Authentication
- Proper deployment
- Testing

---

**Built to prove the multi-channel agent architecture concept.** 🚀
