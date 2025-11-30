# Multi-Tenancy Testing Guide - Step by Step

## Overview
We will test multi-tenancy by:
1. **Web Platform**: Send messages with different tenantIds and verify session isolation
2. **Slack Platform**: Verify Slack adapter works with gateway
3. **Verify Isolation**: Confirm tenants can't see each other's data

---

## PART 1: UNDERSTANDING THE CURRENT SETUP

### Current System
```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
Slack:     Connected via Socket Mode (port 3001)
Database:  In-Memory (sessions stored in RAM)
Tenants:   Currently only "default" is configured
```

### What We'll Test
```
TEST SCENARIO 1: Web Platform - Two Different Tenant IDs
  User A sends message with tenantId = "default"
  User B sends message with tenantId = "acme"
  Verify: Sessions are separate, isolated

TEST SCENARIO 2: Slack Platform - Verify Integration
  Send Slack message from bot
  Verify: Message processed through gateway
  Verify: Session created with correct tenantId

TEST SCENARIO 3: Multi-Tenant Isolation
  Query sessions from Web with tenantId = "default"
  Query sessions from Web with tenantId = "acme"
  Verify: Each tenant only sees their own sessions
```

---

## PART 2: WEB PLATFORM TESTING (Different Tenant IDs)

### Step 1: Ensure Backend is Running
```bash
LOCATION: Terminal 1
COMMAND: npm run dev (in backend directory)

EXPECTED OUTPUT:
  ✓ Backend server running on http://localhost:3000
  ✓ Web chat endpoint: POST http://localhost:3000/api/chat
  ✓ Chat Gateway active with adapters: web, slack
```

### Step 2: Test Tenant "default" - First User

**Request 1: Send message as User from Tenant "default"**

```bash
URL: http://localhost:3000/api/chat
METHOD: POST
HEADERS: Content-Type: application/json

REQUEST BODY:
{
  "message": "Hello from default tenant",
  "userId": "user-default-1",
  "tenantId": "default"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Agent received message",
  "sessionId": "default-user-default-1-web-1764408822121"
                └──────┘ └──────────────┘ └──┘ └────────────────┘
                Tenant    UserId         Platform  Timestamp
}
```

**What to verify:**
- ✓ Response status 200 OK
- ✓ SessionId includes "default" at the beginning
- ✓ SessionId format: `{tenantId}-{userId}-{platform}-{timestamp}`
- ✓ Save sessionId for later testing

### Step 3: Test Tenant "default" - Second User

**Request 2: Different user, same tenant**

```bash
URL: http://localhost:3000/api/chat
METHOD: POST

REQUEST BODY:
{
  "message": "Hello from another user",
  "userId": "user-default-2",
  "tenantId": "default"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Agent received message",
  "sessionId": "default-user-default-2-web-1764408822122"
                └──────┘ └──────────────┘ └──┘ └────────────────┘
                Tenant    UserId         Platform  Timestamp
}
```

**What to verify:**
- ✓ Different sessionId (different userId)
- ✓ Still tenantId = "default"
- ✓ Both users in same tenant

### Step 4: Test Tenant "acme" - First User

**Request 3: Different tenant, first user**

```bash
URL: http://localhost:3000/api/chat
METHOD: POST

REQUEST BODY:
{
  "message": "Hello from ACME tenant",
  "userId": "user-acme-1",
  "tenantId": "acme"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Agent received message",
  "sessionId": "acme-user-acme-1-web-1764408822123"
               └───┘ └──────────┘ └──┘ └────────────────┘
               Tenant  UserId     Platform  Timestamp
}
```

**What to verify:**
- ✓ SessionId starts with "acme" (different tenant!)
- ✓ Different user ID
- ✓ Response success

### Step 5: Test Tenant "acme" - Second User

**Request 4: ACME tenant, second user**

```bash
URL: http://localhost:3000/api/chat
METHOD: POST

REQUEST BODY:
{
  "message": "Another ACME user",
  "userId": "user-acme-2",
  "tenantId": "acme"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Agent received message",
  "sessionId": "acme-user-acme-2-web-1764408822124"
}
```

### Step 6: Verify Isolation - List All Sessions

**Request 5: List ALL sessions (no filter)**

```bash
URL: http://localhost:3000/api/sessions
METHOD: GET
```

**Expected Response:**
```json
[
  {
    "sessionId": "default-user-default-1-web-1764408822121",
    "userId": "user-default-1",
    "tenantId": "default",
    "platform": "web",
    "createdAt": 1764408822121,
    "lastActivity": 1764408822121,
    "metadata": {}
  },
  {
    "sessionId": "default-user-default-2-web-1764408822122",
    "userId": "user-default-2",
    "tenantId": "default",
    "platform": "web",
    "createdAt": 1764408822122,
    "lastActivity": 1764408822122,
    "metadata": {}
  },
  {
    "sessionId": "acme-user-acme-1-web-1764408822123",
    "userId": "user-acme-1",
    "tenantId": "acme",
    "platform": "web",
    "createdAt": 1764408822123,
    "lastActivity": 1764408822123,
    "metadata": {}
  },
  {
    "sessionId": "acme-user-acme-2-web-1764408822124",
    "userId": "user-acme-2",
    "tenantId": "acme",
    "platform": "web",
    "createdAt": 1764408822124,
    "lastActivity": 1764408822124,
    "metadata": {}
  }
]
```

**What to verify:**
- ✓ Total 4 sessions returned
- ✓ 2 sessions with tenantId = "default"
- ✓ 2 sessions with tenantId = "acme"

### Step 7: Filter Sessions by Tenant "default"

**Request 6: List sessions for tenant "default" only**

```bash
URL: http://localhost:3000/api/sessions?tenantId=default
METHOD: GET
```

**Expected Response:**
```json
[
  {
    "sessionId": "default-user-default-1-web-1764408822121",
    "userId": "user-default-1",
    "tenantId": "default",
    "platform": "web"
  },
  {
    "sessionId": "default-user-default-2-web-1764408822122",
    "userId": "user-default-2",
    "tenantId": "default",
    "platform": "web"
  }
]
```

**IMPORTANT - What to verify (MULTI-TENANCY TEST):**
- ✓ ONLY 2 sessions returned (not 4)
- ✓ Both have tenantId = "default"
- ✓ ACME sessions are NOT visible
- ✓ This proves TENANT ISOLATION ✓✓✓

### Step 8: Filter Sessions by Tenant "acme"

**Request 7: List sessions for tenant "acme" only**

```bash
URL: http://localhost:3000/api/sessions?tenantId=acme
METHOD: GET
```

**Expected Response:**
```json
[
  {
    "sessionId": "acme-user-acme-1-web-1764408822123",
    "userId": "user-acme-1",
    "tenantId": "acme",
    "platform": "web"
  },
  {
    "sessionId": "acme-user-acme-2-web-1764408822124",
    "userId": "user-acme-2",
    "tenantId": "acme",
    "platform": "web"
  }
]
```

**CRITICAL MULTI-TENANCY VERIFICATION:**
- ✓ ONLY 2 sessions returned (not 4)
- ✓ Both have tenantId = "acme"
- ✓ DEFAULT tenant sessions are NOT visible
- ✓ This proves COMPLETE ISOLATION ✓✓✓

### Step 9: Retrieve Specific Session (Cross-Tenant Test)

**Request 8: Try to get a DEFAULT tenant session**

```bash
URL: http://localhost:3000/api/session/default-user-default-1-web-1764408822121
METHOD: GET
```

**Expected Response:**
```json
{
  "sessionId": "default-user-default-1-web-1764408822121",
  "userId": "user-default-1",
  "tenantId": "default",
  "platform": "web",
  "createdAt": 1764408822121,
  "lastActivity": 1764408822121,
  "metadata": {}
}
```

**What to verify:**
- ✓ Returns the correct session
- ✓ Data is complete

### Step 10: Retrieve ACME Tenant Session

**Request 9: Get an ACME session**

```bash
URL: http://localhost:3000/api/session/acme-user-acme-1-web-1764408822123
METHOD: GET
```

**Expected Response:**
```json
{
  "sessionId": "acme-user-acme-1-web-1764408822123",
  "userId": "user-acme-1",
  "tenantId": "acme",
  "platform": "web",
  "createdAt": 1764408822123,
  "lastActivity": 1764408822123,
  "metadata": {}
}
```

**What to verify:**
- ✓ Returns correct session
- ✓ Shows different tenantId

---

## PART 3: SLACK PLATFORM TESTING

### Prerequisites
- Slack Bot Token configured in `.env`
- Slack App Token configured in `.env`
- Bot invited to Slack workspace
- Backend running (should show "✓ Slack bot running on Socket Mode")

### Step 1: Verify Slack Adapter is Connected

**Check Backend Logs:**
```
LOCATION: Backend terminal
LOOK FOR:
  ✓ Slack adapter initialized
  ✓ Slack bot running on Socket Mode (port 3001)
  ✓ Now connected to Slack
```

### Step 2: Send Message from Slack (Web UI)

**In Slack App:**
1. Open your Slack workspace
2. Find the bot you created
3. Send a direct message to the bot:
   ```
   @bot_name hello from slack
   ```

**What happens:**
1. Slack adapter receives message
2. Gateway processes it
3. Normalizes to UnifiedMessage format
4. Creates session with tenantId = "default" (default tenant)
5. Invokes agent
6. Response sent back to Slack

### Step 3: Verify Session Created from Slack

**Request: Check if Slack message created a session**

```bash
URL: http://localhost:3000/api/sessions?tenantId=default
METHOD: GET
```

**Expected Response:**
```json
[
  {
    "sessionId": "default-<your-slack-user-id>-slack-1764408822125",
    "userId": "<your-slack-user-id>",
    "tenantId": "default",
    "platform": "slack",
    "createdAt": 1764408822125,
    "lastActivity": 1764408822125,
    "metadata": {
      "lastMessageTime": "2025-11-29T...",
      "lastPlatform": "slack"
    }
  },
  ...other sessions from web
]
```

**IMPORTANT - What to verify:**
- ✓ New session created
- ✓ platform = "slack" (not "web")
- ✓ tenantId = "default"
- ✓ Slack and Web sessions are in SAME tenant "default"
- ✓ This confirms multi-platform support ✓

---

## PART 4: MULTI-TENANT SECURITY TEST

### Test: Can Slack and Web Users See Each Other's Sessions?

**Scenario:** 
- Web user from tenant "default" sends message
- Slack user from tenant "default" sends message
- Both in SAME tenant

**Step 1: Send Web Message (Tenant "default")**
```bash
URL: http://localhost:3000/api/chat
REQUEST:
{
  "message": "Web user message",
  "userId": "web-user-secure-test",
  "tenantId": "default"
}
```

**Step 2: Send Slack Message (Tenant "default")**
```
@bot hello from slack
(in Slack workspace)
```

**Step 3: List Sessions for Tenant "default"**
```bash
URL: http://localhost:3000/api/sessions?tenantId=default
METHOD: GET
```

**Expected Response:**
```json
[
  {
    "sessionId": "default-web-user-secure-test-web-...",
    "userId": "web-user-secure-test",
    "tenantId": "default",
    "platform": "web"
  },
  {
    "sessionId": "default-<slack-user-id>-slack-...",
    "userId": "<slack-user-id>",
    "tenantId": "default",
    "platform": "slack"
  }
]
```

**Multi-Tenancy Verification:**
- ✓ Both users can see each other (SAME tenant "default")
- ✓ Different platforms (web, slack)
- ✓ All sessions have same tenantId = "default"
- ✓ This is CORRECT behavior ✓

---

## PART 5: ADVANCED MULTI-TENANT TEST (Two Separate Tenants)

### Objective
Prove that two different tenants cannot see each other's sessions.

### Step 1: Create Sessions in Tenant "default"

**Request 1:**
```bash
URL: http://localhost:3000/api/chat
REQUEST:
{
  "message": "Default tenant user",
  "userId": "default-user-final",
  "tenantId": "default"
}
```

### Step 2: Create Sessions in Tenant "acme"

**Request 2:**
```bash
URL: http://localhost:3000/api/chat
REQUEST:
{
  "message": "ACME tenant user",
  "userId": "acme-user-final",
  "tenantId": "acme"
}
```

### Step 3: Verify Tenant Isolation

**Query 1: What does "default" tenant see?**
```bash
URL: http://localhost:3000/api/sessions?tenantId=default
```

**Result:**
- ✓ Sees only "default" sessions
- ✗ Does NOT see "acme" sessions

**Query 2: What does "acme" tenant see?**
```bash
URL: http://localhost:3000/api/sessions?tenantId=acme
```

**Result:**
- ✓ Sees only "acme" sessions
- ✗ Does NOT see "default" sessions

**MULTI-TENANCY PROOF:**
```
Tenant "default" isolation: ✓✓✓
Tenant "acme" isolation: ✓✓✓
Cross-tenant visibility: ✗✗✗ (BLOCKED)
Multi-tenancy working: YES ✓✓✓
```

---

## TESTING CHECKLIST

### Web Platform Tests
- [ ] Step 1: Backend running
- [ ] Step 2: Send message as User1, Tenant "default"
- [ ] Step 3: Send message as User2, Tenant "default"
- [ ] Step 4: Send message as User1, Tenant "acme"
- [ ] Step 5: Send message as User2, Tenant "acme"
- [ ] Step 6: List all sessions (should see 4)
- [ ] Step 7: Filter by "default" (should see 2)
- [ ] Step 8: Filter by "acme" (should see 2)
- [ ] Step 9: Get specific session from "default"
- [ ] Step 10: Get specific session from "acme"

### Slack Platform Tests
- [ ] Backend shows Slack adapter initialized
- [ ] Send message from Slack bot
- [ ] Verify session created with platform = "slack"
- [ ] Verify session in tenantId = "default"
- [ ] Verify Slack session listed with Web sessions

### Multi-Tenant Security Tests
- [ ] Web and Slack users in "default" can see each other's sessions
- [ ] "default" tenant users cannot see "acme" tenant sessions
- [ ] "acme" tenant users cannot see "default" tenant sessions
- [ ] Query filtering works correctly per tenant

### Final Verification
- [ ] All sessions have correct tenantId
- [ ] Platform field shows correct adapter (web/slack)
- [ ] SessionId format includes all components
- [ ] No cross-tenant data leakage

---

## EXPECTED TEST RESULTS

### ✅ If Multi-Tenancy is Working Correctly:

```
Web Platform Test:
  ✓ 2 sessions created for "default" tenant
  ✓ 2 sessions created for "acme" tenant
  ✓ Filtering by "default" shows only 2 (not 4)
  ✓ Filtering by "acme" shows only 2 (not 4)

Slack Platform Test:
  ✓ Slack message creates session
  ✓ Session has platform = "slack"
  ✓ Session has tenantId = "default"

Multi-Tenant Security:
  ✓ No cross-tenant visibility
  ✓ Each tenant isolated
  ✓ Data completely separated

MULTI-TENANCY: ✅ WORKING CORRECTLY
```

### ❌ If Multi-Tenancy is NOT Working:

```
Problems to check:
  ✗ Filtering returns all sessions (isolation failed)
  ✗ Slack sessions don't have correct tenantId
  ✗ Different tenants can see each other's data
  ✗ SessionId doesn't include tenantId

What to fix:
  1. Check tenantId is passed in requests
  2. Verify session-manager.ts filters correctly
  3. Check gateway.ts validates tenantId
  4. Ensure Slack adapter passes tenantId
```

---

## Tools for Testing

### Option 1: Using PowerShell (Command Line)
```powershell
# Test request
$body = @{ 
  message = "Hello"; 
  userId = "test-user"; 
  tenantId = "default" 
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "http://localhost:3000/api/chat" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Option 2: Using Postman
1. Download Postman (https://www.postman.com)
2. Create new request
3. Method: POST
4. URL: http://localhost:3000/api/chat
5. Headers: Content-Type: application/json
6. Body: 
```json
{
  "message": "test",
  "userId": "user1",
  "tenantId": "default"
}
```
7. Send

### Option 3: Using cURL
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "userId": "user1",
    "tenantId": "default"
  }'
```

---

## Summary

This testing guide verifies:

1. **Web Platform Multi-Tenancy**
   - Different tenantIds create separate sessions
   - Sessions properly isolated

2. **Slack Platform Integration**
   - Slack messages processed through gateway
   - Sessions created with correct tenantId

3. **Cross-Platform Support**
   - Web and Slack users coexist in same tenant
   - Different platforms tracked separately

4. **Multi-Tenant Security**
   - Tenant A cannot see Tenant B's data
   - Complete data isolation verified

**Expected Outcome: Multi-Tenancy is WORKING ✅✅✅**
