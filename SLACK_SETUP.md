# Slack Bot Setup Guide - Tested & Working ✅

## ⚡ Socket Mode Setup (NO ngrok needed!)

Socket Mode allows local development without exposing your backend to the internet. **This method is tested and working.**

### Prerequisites

1. A Slack workspace where you have admin access
2. Node.js 18+ installed
3. Backend running locally

---

## 🚀 Complete Setup Steps (Tested)

### Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. App Name: `PoC Agent Bot`
5. Pick your workspace
6. Click **"Create App"**

### Step 2: Configure Bot Token Scopes

1. Go to **"OAuth & Permissions"** (left sidebar)
2. Scroll down to **"Scopes"**
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add these scopes:
   - ✅ `app_mentions:read` - Read bot mentions
   - ✅ `channels:history` - Read channel messages
   - ✅ `channels:read` - Read channel info
   - ✅ `chat:write` - Send messages
   - ✅ `chat:write.customize` - Send with custom name/avatar
   - ✅ `chat:write.public` - Send to any public channel
   - ✅ `groups:history` - Read private channel messages
   - ✅ `groups:read` - Read private channel info
   - ✅ `im:history` - Read DM messages
   - ✅ `im:read` - Read DM info
   - ✅ `users:read` - Read user list
5. Scroll up and click **"Install to Workspace"**
6. Click **"Allow"**
7. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Step 3: Enable Socket Mode

1. Go to **"Socket Mode"** (left sidebar)
2. Click **"Enable Socket Mode"**
3. Enter a name like `poc-dev`
4. Click **"Generate"**
5. Copy the **App-Level Token** (starts with `xapp-`)

### Step 4: Subscribe to Events

1. Go to **"Event Subscriptions"** (left sidebar)
2. Toggle **"Enable Events"** to **ON**
3. Scroll down to **"Subscribe to bot events"**
4. Click **"Add Bot User Event"**
5. Add these events:
   - ✅ `message.channels` - Messages in public channels
   - ✅ `message.groups` - Messages in private channels
   - ✅ `message.im` - Direct messages
6. Click **"Save Changes"**

### Step 5: Update .env File

Update `backend/.env` with your tokens:

```
PORT=3000
SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN-HERE
SLACK_APP_TOKEN=xapp-YOUR-TOKEN-HERE
SLACK_SIGNING_SECRET=YOUR-SIGNING-SECRET-HERE
SLACK_PORT=3001
```

**Where to find each:**
- **SLACK_BOT_TOKEN**: OAuth & Permissions → Bot User OAuth Token (xoxb-...)
- **SLACK_APP_TOKEN**: Socket Mode → App-Level Token (xapp-...)
- **SLACK_SIGNING_SECRET**: Basic Information → App Credentials → Signing Secret

### Step 6: Start Backend

```powershell
cd backend
npm run dev
```

**Expected output:**
```
[INFO]  socket-mode:SocketModeClient:0 Going to establish a new connection to Slack ...
✓ Backend server running on http://localhost:3000
✓ Web chat endpoint: POST http://localhost:3000/api/chat
✓ Slack bot running on Socket Mode (port 3001)
[INFO]  socket-mode:SocketModeClient:0 Now connected to Slack
```

### Step 7: Invite Bot to Slack Channel

1. In your Slack workspace, go to any channel
2. Click the channel name at the top
3. Go to **"Integrations"** → **"Apps"**
4. Click **"Add an App"**
5. Search for your bot name (e.g., "PoC Agent Bot")
6. Click to add it

### Step 8: Test in Slack ✅

Send these messages to the bot:

1. **`@PoC Agent Bot hello`**
   - Bot responds: `Hi! I'm your PoC agent.` ✅

2. **`@PoC Agent Bot help`**
   - Bot responds: `I support multiple channels like web and Slack.` ✅

3. **`@PoC Agent Bot test message`**
   - Bot responds: `You said: test message` ✅

**Status: TESTED AND WORKING!** 🎉

---

## 🐛 Troubleshooting

### Bot not responding at all
- ✅ Make sure bot is invited to the channel (Step 7)
- ✅ Verify Event Subscriptions is enabled (Step 4)
- ✅ Check that you subscribed to `message.channels`, `message.groups`, `message.im`
- ✅ Restart backend after updating `.env`
- ✅ Check backend logs for errors

### "Invalid token" error
- Make sure `SLACK_BOT_TOKEN` starts with `xoxb-` (not `xapp-`)
- Make sure `SLACK_APP_TOKEN` starts with `xapp-` (not `xoxb-`)
- Don't mix up the tokens

### Socket Mode connection fails
- Check that `SLACK_APP_TOKEN` is correct in `.env`
- Verify it starts with `xapp-`
- Restart backend with `npm run dev`

### Bot echoes back the entire message including mention
- This was fixed in the adapter code
- If still happening, make sure you're running the latest backend code
- Run `npm run dev` again

### "Bot not in channel" error
- Go to the channel and invite the bot manually (Step 7)
- Or add the bot to the workspace in OAuth settings

---

## ✅ Verified Working Configuration

This setup has been tested and confirmed working with:

- **Backend**: TypeScript + Express + Slack Bolt with Socket Mode
- **Frontend**: React + Vite (optional for web testing)
- **Agent**: Central brain handling both web and Slack messages
- **Test Results**:
  - ✅ `@PoC Agent Bot hello` → `Hi! I'm your PoC agent.`
  - ✅ `@PoC Agent Bot help` → `I support multiple channels like web and Slack.`
  - ✅ `@PoC Agent Bot <anything>` → `You said: <anything>`

---

## 🎉 Same Agent, Multiple Platforms!

Your bot now works on:
- ✅ **Web Chat** (React UI at http://localhost:5173)
- ✅ **Slack** (Socket Mode, tested and working)

The same `agent.ts` code processes messages from both platforms without any duplication!
