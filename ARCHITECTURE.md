# Architecture Diagram & Code Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    MULTI-CHANNEL AGENT                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  CENTRAL AGENT BRAIN                 │  │
│  │                    (agent.ts)                        │  │
│  │                                                      │  │
│  │  process(UniversalMessage) → UniversalResponse     │  │
│  │                                                      │  │
│  │  - "hello" → "Hi! I'm your PoC agent."            │  │
│  │  - "help" → "I support multiple channels..."      │  │
│  │  - else → "You said: {message}"                   │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↑                                  ↑              │
│           │                                  │              │
│    ┌──────┴──────┐            ┌─────────────┴──────┐       │
│    │   ADAPTER   │            │    ADAPTER        │       │
│    │  (Web)      │            │   (Slack)         │       │
│    └──────┬──────┘            └─────────┬──────────┘       │
│           │                             │                  │
└───────────┼─────────────────────────────┼──────────────────┘
            │                             │
            ▼                             ▼
    ┌────────────────┐          ┌──────────────────┐
    │  WEB CHANNEL   │          │ SLACK CHANNEL    │
    │                │          │                  │
    │  React UI      │          │  Slack Bot       │
    │  localhost:    │          │  (Bolt SDK)      │
    │  5173/         │          │  Workspace Chat  │
    │                │          │                  │
    │  User types:   │          │  User types:     │
    │  "hello"       │          │  "hello" in DM   │
    │       ↓        │          │       ↓          │
    │  POST /api/    │          │ Slack event      │
    │  chat          │          │ listener         │
    │       ↓        │          │       ↓          │
    │  Express       │          │  say() reply     │
    │  localhost:    │          │  back to Slack   │
    │  3000/         │          │                  │
    └────────────────┘          └──────────────────┘
```

## Message Flow: Web Chat Example

```
1. USER SENDS MESSAGE
   ┌─────────────────────────────────────┐
   │ React UI                            │
   │ Input: "hello"                      │
   │ Click: Send Button                  │
   └──────────────┬──────────────────────┘
                  │
                  ▼
2. CALL BACKEND
   ┌─────────────────────────────────────┐
   │ src/api/agent.ts                    │
   │ axios.post(                         │
   │   'http://localhost:3000/api/chat', │
   │   { message: "hello" }              │
   │ )                                   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
3. WEB ADAPTER RECEIVES
   ┌─────────────────────────────────────┐
   │ src/adapters/web-adapter.ts         │
   │ POST /api/chat                      │
   │ Body: { message: "hello" }          │
   │                                     │
   │ Convert to UniversalMessage:        │
   │ {                                   │
   │   text: "hello",                    │
   │   user: { id: "web-user-..." },    │
   │   platform: "web"                   │
   │ }                                   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
4. AGENT PROCESSES
   ┌─────────────────────────────────────┐
   │ src/agent.ts                        │
   │                                     │
   │ agent.process(universalMessage)    │
   │                                     │
   │ text === "hello" → return {         │
   │   text: "Hi! I'm your PoC agent."  │
   │   platform: "web"                   │
   │ }                                   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
5. ADAPTER SENDS RESPONSE
   ┌─────────────────────────────────────┐
   │ src/adapters/web-adapter.ts         │
   │                                     │
   │ res.json({                          │
   │   response: "Hi! I'm your..."      │
   │ })                                  │
   └──────────────┬──────────────────────┘
                  │
                  ▼
6. REACT DISPLAYS
   ┌─────────────────────────────────────┐
   │ src/components/ChatInterface.tsx   │
   │                                     │
   │ Message appears in chat:            │
   │ [Agent]: "Hi! I'm your PoC agent."│
   │                                     │
   └─────────────────────────────────────┘
```

## Message Flow: Slack Example

```
1. USER SENDS MESSAGE
   ┌─────────────────────────────────────┐
   │ Slack Workspace                     │
   │ User: "hello"                       │
   │ Channel or DM to Bot                │
   └──────────────┬──────────────────────┘
                  │
                  ▼
2. SLACK SENDS EVENT
   ┌─────────────────────────────────────┐
   │ Slack API (via ngrok/public URL)   │
   │ POST /slack/events                  │
   │ Body: Slack message event           │
   │ Headers: Slack signing secret       │
   └──────────────┬──────────────────────┘
                  │
                  ▼
3. SLACK ADAPTER RECEIVES
   ┌─────────────────────────────────────┐
   │ src/adapters/slack-adapter.ts       │
   │ slackApp.message()                  │
   │ Event contains: text, user          │
   │                                     │
   │ Convert to UniversalMessage:        │
   │ {                                   │
   │   text: "hello",                    │
   │   user: { id: "U123456" },         │
   │   platform: "slack"                 │
   │ }                                   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
4. AGENT PROCESSES
   ┌─────────────────────────────────────┐
   │ src/agent.ts                        │
   │                                     │
   │ agent.process(universalMessage)    │
   │ (SAME METHOD as web flow!)         │
   │                                     │
   │ Returns:                            │
   │ {                                   │
   │   text: "Hi! I'm your PoC agent."  │
   │   platform: "slack"                 │
   │ }                                   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
5. ADAPTER SENDS RESPONSE
   ┌─────────────────────────────────────┐
   │ src/adapters/slack-adapter.ts       │
   │                                     │
   │ await say(                          │
   │   "Hi! I'm your PoC agent."        │
   │ )                                   │
   │                                     │
   │ (Bolt SDK handles Slack API call)  │
   └──────────────┬──────────────────────┘
                  │
                  ▼
6. SLACK DISPLAYS
   ┌─────────────────────────────────────┐
   │ Slack Workspace                     │
   │                                     │
   │ Bot reply appears:                  │
   │ "Hi! I'm your PoC agent."          │
   │                                     │
   └─────────────────────────────────────┘
```

## Key Code Points

### 1. Central Agent (src/agent.ts)
```typescript
class Agent {
  process(message: UniversalMessage): UniversalResponse {
    const text = message.text.toLowerCase().trim();
    
    if (text === "hello") {
      return { text: "Hi! I'm your PoC agent.", platform: message.platform };
    }
    // ... more logic
  }
}
```

**Both adapters call this SAME method. No duplication.**

### 2. Web Adapter (src/adapters/web-adapter.ts)
```typescript
app.post("/api/chat", (req, res) => {
  // 1. Convert web request to UniversalMessage
  const msg = { text: req.body.message, user: {...}, platform: "web" };
  
  // 2. Send to agent
  const response = agent.process(msg);
  
  // 3. Convert response back to web format
  res.json({ response: response.text });
});
```

### 3. Slack Adapter (src/adapters/slack-adapter.ts)
```typescript
slackApp.message(async ({ message, say }) => {
  // 1. Convert Slack event to UniversalMessage
  const msg = { text: message.text, user: {...}, platform: "slack" };
  
  // 2. Send to agent (SAME METHOD!)
  const response = agent.process(msg);
  
  // 3. Send response back to Slack
  await say(response.text);
});
```

## Why This Proves the Architecture

✓ **Single Agent Brain**: Both web and Slack hit `agent.process()`
✓ **No Logic Duplication**: Agent logic is one file, one method
✓ **Adapter Pattern**: Each platform has minimal translation code
✓ **Extensible**: New platforms just need a new adapter that calls `agent.process()`
✓ **Maintainable**: Update agent logic in one place, both channels get the change

---

This is the essence of multi-channel architecture: **One brain, many interfaces.**
