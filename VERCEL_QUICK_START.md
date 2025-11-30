# Vercel Deployment - Quick Start Guide

## 3-Step Deployment to Vercel

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select your GitHub repo: **vigneshpatel14/PoC_Adapters_GEP**
4. Click **"Import"**

### Step 2: Configure Project Settings

**Framework Preset:** Select **"Other"** (we'll configure manually)

**Root Directory:** Leave empty (project is at root)

**Environment Variables:** Add these:
```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_APP_TOKEN=xapp-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret
NODE_ENV=production
AGENT_INVOKE_URL=[Leave empty for mock agent, or enter your agent URL]
```

Click **"Deploy"** → Vercel builds and deploys automatically! ✅

### Step 3: Test Your Deployment

After deployment completes, you'll get a URL like:
```
https://gep-adapters.vercel.app
```

**Test it:**
```bash
# Health check
curl https://gep-adapters.vercel.app/health

# Send a message (mock agent)
curl -X POST https://gep-adapters.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "userId": "test-user",
    "tenantId": "default"
  }'
```

---

## What's Included

✅ **Backend** - Express.js with Chat Gateway  
✅ **Frontend** - React web UI (served from backend)  
✅ **Mock Agent** - Built-in for PoC testing (no setup needed)  
✅ **Multi-tenancy** - Ready to use with "default" and "acme" tenants  
✅ **Session Management** - Auto-create & 24-hour lifecycle  
✅ **Slack Integration** - Ready (if you add Slack credentials)  

---

## Current Setup

**Agent URL for Vercel:** `https://your-vercel-app.vercel.app/api/agent` (automatic)  
**Frontend URL:** `https://your-vercel-app.vercel.app` (included)  
**Mock Agent Status:** ✅ Enabled by default (no external setup needed)  

---

## After Deployment

### To Test Locally:
```bash
npm run dev         # Starts backend
cd frontend && npm run dev  # Starts frontend in new terminal
# Visit http://localhost:5173
```

### To Test on Vercel:
Visit `https://your-vercel-app.vercel.app` and try:
- Tenant: "default" or "acme"
- Send messages (mock agent will respond)
- Check sessions to see multi-tenancy working

### When Ready for Real Agent:
1. Update `AGENT_INVOKE_URL` environment variable to your real agent service
2. Click **"Redeploy"** in Vercel dashboard
3. Your Chat Gateway will now invoke your real agent instead of mock

---

## Environment Variables Reference

| Variable | Required | Notes |
|----------|----------|-------|
| `SLACK_BOT_TOKEN` | No | Only needed if using Slack |
| `SLACK_APP_TOKEN` | No | Only needed if using Slack |
| `SLACK_SIGNING_SECRET` | No | Only needed if using Slack |
| `AGENT_INVOKE_URL` | No | Leave empty for mock agent |
| `NODE_ENV` | No | Set to `production` for Vercel |

---

## Troubleshooting

**503 Service Unavailable**
- Check Vercel deployment logs
- Verify environment variables are set
- Check if Slack tokens are correct (if Slack enabled)

**Mock agent not responding**
- It should work by default
- Check if AGENT_INVOKE_URL is empty or points to your Vercel app
- Try: `curl https://your-app.vercel.app/api/agent -X POST -d '{"message":"test"}'`

**Frontend not loading**
- Backend must serve frontend static files
- Check `backend/public` folder exists
- Verify `npm run build` completed successfully

---

## Vercel Deployment Features

✅ Automatic deploys on git push  
✅ Preview URLs for each PR  
✅ Environment variable management  
✅ HTTPS by default  
✅ Logs and monitoring built-in  
✅ Auto-rollback on errors  
✅ Free tier available  

---

## Your Vercel Dashboard

After first deployment:
1. Go to https://vercel.com/dashboard
2. Your project appears in the list
3. Click to view:
   - Deployment logs
   - Environment variables
   - Analytics
   - Custom domains

---

## Next Steps

1. **Deploy now** (follow 3 steps above)
2. **Add Slack credentials** (optional - for Slack channel)
3. **Test multi-tenancy** from the web UI
4. **Connect real agent** when ready (update AGENT_INVOKE_URL)
5. **Monitor** using Vercel dashboard

**That's it! Your Chat Gateway is now live on the internet! 🚀**
