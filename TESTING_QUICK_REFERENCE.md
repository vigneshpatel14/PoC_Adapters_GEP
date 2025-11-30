# Multi-Tenancy Testing - Quick Reference Card

## 🚀 Quick Start Testing

### Running Systems
```
Terminal 1: Backend (Port 3000)
  cd backend
  npm run dev

Terminal 2: Frontend (Port 5173)
  cd frontend
  npm run dev
```

---

## 🧪 TEST 1: Web Platform (Different Tenant IDs)

### Send Message - Tenant "default"
```powershell
$body = @{ 
  message = "Hello from default"; 
  userId = "user-default-1"; 
  tenantId = "default" 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
  -Method POST -ContentType "application/json" -Body $body | 
  ConvertFrom-Json | ConvertTo-Json
```

**Save returned sessionId:** `default-user-default-1-web-1764408822121`

---

### Send Message - Tenant "acme"
```powershell
$body = @{ 
  message = "Hello from acme"; 
  userId = "user-acme-1"; 
  tenantId = "acme" 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
  -Method POST -ContentType "application/json" -Body $body | 
  ConvertFrom-Json | ConvertTo-Json
```

**Save returned sessionId:** `acme-user-acme-1-web-1764408822123`

---

## ✅ VERIFICATION 1: Is Data Isolated?

### List ALL Sessions
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** 2+ sessions total (from both tenants mixed together)

---

### List ONLY "default" Tenant
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions?tenantId=default" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** Only sessions with `"tenantId": "default"`

---

### List ONLY "acme" Tenant
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions?tenantId=acme" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** Only sessions with `"tenantId": "acme"`

---

## 🧪 TEST 2: Slack Platform Testing

### Check Slack is Connected
```
Backend terminal output should show:
  ✓ Slack adapter initialized
  ✓ Slack bot running on Socket Mode (port 3001)
  ✓ Now connected to Slack
```

---

### Send Message from Slack
```
In Slack Workspace:
  1. Find your bot
  2. Send direct message: "hello from slack"
  3. Wait for response
```

---

### Verify Slack Session Created
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions?tenantId=default" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:**
- New session with `"platform": "slack"`
- `"tenantId": "default"`
- SessionId format: `default-<slack-user-id>-slack-<timestamp>`

---

## 🧪 TEST 3: Multi-Tenant Isolation

### Create Tenant A Session
```powershell
$body = @{ 
  message = "Tenant A"; 
  userId = "user-a"; 
  tenantId = "default" 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
  -Method POST -ContentType "application/json" -Body $body
```

---

### Create Tenant B Session
```powershell
$body = @{ 
  message = "Tenant B"; 
  userId = "user-b"; 
  tenantId = "acme" 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
  -Method POST -ContentType "application/json" -Body $body
```

---

### Query from Tenant A
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions?tenantId=default" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** 
- ✅ Can see Tenant A's sessions
- ❌ CANNOT see Tenant B's sessions

---

### Query from Tenant B
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sessions?tenantId=acme" `
  -Method GET | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** 
- ✅ Can see Tenant B's sessions
- ❌ CANNOT see Tenant A's sessions

---

## ✅ PASS/FAIL CRITERIA

### ✅ MULTI-TENANCY IS WORKING IF:

| Test | Expected Result |
|------|-----------------|
| Different tenantIds | Sessions created with correct tenantId ✓ |
| List all sessions | Shows sessions from both tenants ✓ |
| Filter by "default" | Shows ONLY default tenant sessions ✓ |
| Filter by "acme" | Shows ONLY acme tenant sessions ✓ |
| Slack integration | Creates session with platform="slack" ✓ |
| Slack tenantId | Uses tenantId="default" ✓ |
| Cross-tenant access | Tenant A cannot see Tenant B data ✓ |
| Session isolation | Each tenant fully isolated ✓ |

---

### ❌ MULTI-TENANCY IS FAILING IF:

| Problem | What to Check |
|---------|---------------|
| Filter returns all sessions | SessionId not including tenantId |
| Slack shows wrong tenantId | Slack adapter not passing tenantId |
| Tenants can see each other | Session filtering not working |
| SessionId missing tenantId | Message normalizer issue |

---

## 📊 What Each Successful Test Proves

### Test 1: Different Tenant IDs (Web)
```
✅ PROVES: Application can handle multiple tenants
✅ PROVES: Each message creates session with correct tenantId
✅ PROVES: SessionId includes tenantId for isolation
```

### Test 2: Session Filtering by Tenant
```
✅ PROVES: Application can filter by tenantId
✅ PROVES: Query returns only tenant-specific sessions
✅ PROVES: Tenants cannot see each other's data
```

### Test 3: Slack Integration
```
✅ PROVES: Slack adapter works with gateway
✅ PROVES: Slack messages get correct tenantId
✅ PROVES: Multi-platform support in multi-tenant system
```

### Test 4: Cross-Tenant Isolation
```
✅ PROVES: Complete data isolation between tenants
✅ PROVES: No cross-tenant data leakage
✅ PROVES: Multi-tenancy is WORKING CORRECTLY
```

---

## 🎯 Final Conclusion

After running all tests, you will see:

### If ✅ ALL TESTS PASS:
```
MULTI-TENANCY: WORKING CORRECTLY ✅✅✅

Evidence:
  ✓ Web platform creates separate tenants
  ✓ Slack platform works with tenants
  ✓ Session isolation verified
  ✓ No cross-tenant data access
  ✓ Data is completely separated by tenantId
```

### If ❌ ANY TEST FAILS:
```
ISSUE: Multi-tenancy needs debugging

Check:
  1. Is tenantId being passed in requests?
  2. Is backend receiving tenantId?
  3. Are sessions being filtered by tenantId?
  4. Is Slack adapter passing tenantId?
```

---

## 📝 Testing Notes

**Keep track of:**
- SessionIds returned for each test
- TenantIds used
- Platform values (web/slack)
- Query results for filtering

**Save for reference:**
- Successful sessionIds
- Tenant-specific session counts
- Filter query results

---

## 🔗 Related Files

- `MULTI_TENANCY_EXPLAINED.md` - Detailed explanation
- `PROJECT_COMPLETION_SUMMARY.md` - Full project overview
- Backend code: `backend/src/gateway/` - Implementation details
