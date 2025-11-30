# Deploying Chat Gateway PoC to Vercel

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier available at https://vercel.com)
- Git installed locally

---

## Step 1: Create Vercel Account & Connect Repository

1. **Sign up at Vercel:**
   - Visit https://vercel.com/signup
   - Sign up with GitHub (recommended)
   - Authorize Vercel to access your GitHub account

2. **Import the repository:**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Find and click on `PoC_Adapters_GEP`
   - Click "Import"

---

## Step 2: Configure Environment Variables

After importing, Vercel will show project settings:

1. **Go to Settings → Environment Variables**

2. **Add these variables:**
   ```
   SLACK_BOT_TOKEN = xoxb-your-bot-token-here
   SLACK_APP_TOKEN = xapp-your-app-token-here
   SLACK_SIGNING_SECRET = your-signing-secret-here
   AGENT_INVOKE_URL = https://your-agent-server.com/api/agent
   ```

3. **For each variable:**
   - Select "Production" in the "Add to" dropdown
   - Click "Add Environment Variable"
   - Repeat for all four variables

**Environment Variables Reference:**

| Variable | Description | Example |
|----------|-------------|---------|
| `SLACK_BOT_TOKEN` | Slack bot token | xoxb-1234567890-1234567890-xxxxx |
| `SLACK_APP_TOKEN` | Slack app token | xapp-1-xxxxxxx-xxxxxx |
| `SLACK_SIGNING_SECRET` | Slack signing secret | abc123def456 |
| `AGENT_INVOKE_URL` | Your agent platform URL | https://api.example.com/agent |

---

## Step 3: Configure Build Settings

1. **In Vercel Dashboard:**
   - Go to Settings → Build & Development Settings
   - Ensure these are set:

   ```
   Framework Preset: Other
   Build Command: npm run vercel-build (in both backend and frontend)
   Output Directory: backend/dist (for API), frontend/dist (for static)
   ```

2. **The `vercel.json` file handles routing automatically**

---

## Step 4: Deploy

### Option A: Deploy via Git Push (Automatic)

Every push to `main` branch automatically deploys:

```bash
git add .
git commit -m "Trigger Vercel deployment"
git push origin main
```

Vercel will:
- Build the backend (TypeScript → JavaScript)
- Build the frontend (React + Vite → static files)
- Deploy both together
- Show build status on GitHub

### Option B: Deploy via Vercel CLI (Manual)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production
vercel --prod
```

---

## Step 5: Verify Deployment

1. **Check Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Your project should show "Ready" status

2. **Test the endpoints:**

   ```bash
   # Health check
   curl https://your-project-name.vercel.app/health
   
   # Get sessions
   curl https://your-project-name.vercel.app/api/sessions
   
   # Send a message
   curl -X POST https://your-project-name.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-123",
       "tenantId": "default",
       "platform": "web",
       "message": "Hello"
     }'
   ```

3. **Access the Web UI:**
   - Open https://your-project-name.vercel.app
   - You should see the Chat Interface

---

## Step 6: Configure Slack for Production

1. **Get your production URL from Vercel:**
   - Go to Vercel Dashboard
   - Your project URL will be like: `https://chat-gateway-abc123.vercel.app`

2. **Update Slack Event Subscriptions:**
   - Go to https://api.slack.com/apps/[YOUR_APP_ID]/events
   - Update "Request URL" to: `https://your-project-name.vercel.app/slack/events`
   - Click "Verify URL"

3. **Update Slack Socket Mode URL (if using):**
   - Socket Mode doesn't need URL update (it's outbound only)

---

## Important Limitations & Considerations

### ⚠️ Vercel Limitations:

1. **Cold Starts:**
   - First request may take 5-10 seconds
   - Subsequent requests are fast
   - Use hobby or pro plan to reduce cold starts

2. **Session Storage:**
   - In-memory sessions will be lost after deployment
   - **Consider upgrading to:** PostgreSQL, MongoDB, or Redis
   - Session data persists within a deployment but resets on new deployment

3. **Execution Timeout:**
   - Vercel limits function execution to 60 seconds (Pro: 60s, Enterprise: 900s)
   - Our agent calls are configured for 30s timeout (safe)

4. **Maximum Deployment Size:**
   - Vercel allows up to 50MB
   - Our project is ~5MB (well within limit)

### ✅ What Works Great on Vercel:

- ✅ API endpoints (serverless)
- ✅ Static frontend files
- ✅ Slack integration (Socket Mode)
- ✅ Multi-tenant architecture
- ✅ Session management (within deployment lifetime)
- ✅ Message processing

### 🔄 For Production with Session Persistence:

If you need persistent sessions across deployments, upgrade to:

```bash
# Option 1: Vercel + PostgreSQL (via Vercel Postgres)
# Go to Vercel Dashboard → Storage → PostgreSQL
# Add to environment variables

# Option 2: Vercel + MongoDB Atlas (free tier)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chat-gateway

# Option 3: Vercel + Redis (Upstash)
REDIS_URL=redis://xxx:yyy@your-redis-host:port
```

---

## Step 7: Setup CI/CD Pipeline

1. **GitHub Actions (Optional but Recommended)**

Create `.github/workflows/vercel-deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/actions/deploy-production@main
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

2. **Setup Vercel Secrets in GitHub:**
   - Go to GitHub Repo → Settings → Secrets
   - Add from Vercel Dashboard:
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`

---

## Monitoring & Debugging

### View Logs:
```bash
# Vercel CLI
vercel logs

# Or use Vercel Dashboard → Deployments → Logs
```

### Common Issues:

**Build Fails - "MODULE_NOT_FOUND":**
```bash
# Make sure both package-lock.json files are committed
git add backend/package-lock.json
git add frontend/package-lock.json
git commit -m "Add package locks"
git push
```

**Slack Token Error:**
- Verify environment variables are set in Vercel Dashboard
- Make sure values don't have extra spaces
- Redeploy after fixing: `vercel --prod`

**Cold Start Timeout:**
- Upgrade to Vercel Pro plan
- Or pre-warm endpoints with monitoring

**Sessions Lost After Deployment:**
- This is expected with in-memory storage
- Upgrade to persistent database for production

---

## Accessing Your Deployment

| Component | URL |
|-----------|-----|
| Web UI | https://your-project-name.vercel.app |
| API Health | https://your-project-name.vercel.app/health |
| API Chat | https://your-project-name.vercel.app/api/chat |
| API Sessions | https://your-project-name.vercel.app/api/sessions |
| Slack Webhook | https://your-project-name.vercel.app/slack/events |

---

## Production Deployment Checklist

- [ ] Vercel account created and repository connected
- [ ] All 4 environment variables configured in Vercel
- [ ] Built and deployed successfully (no errors)
- [ ] Health endpoint returning 200 OK
- [ ] Web UI accessible and functional
- [ ] Slack integration working (test with a message)
- [ ] Multi-tenancy verified with different tenant IDs
- [ ] Sessions are being created and persisted (within deployment)
- [ ] Monitoring/logging configured
- [ ] Backup plan for session data (if needed)

---

## Rollback Deployment

If something goes wrong:

```bash
# Via Vercel Dashboard:
# 1. Go to Deployments tab
# 2. Find the previous good deployment
# 3. Click the "..." menu and select "Promote to Production"

# Via CLI:
vercel rollback
```

---

## Next Steps

1. **Scale beyond Vercel (Optional):**
   - Move to Docker + Kubernetes for enterprise scale
   - Or use AWS Fargate, Azure Container Instances, etc.

2. **Add Persistent Storage:**
   - Integrate PostgreSQL or MongoDB
   - Upgrade SessionManager to use external database

3. **Add Monitoring:**
   - Setup Sentry for error tracking
   - Add DataDog or New Relic for performance monitoring
   - Create Slack alerts for deployment issues

4. **Performance Optimization:**
   - Enable CDN edge caching for frontend
   - Implement message queue (Bull, RabbitMQ) for scalability

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI:** https://vercel.com/docs/cli
- **Slack Integration Guide:** See SLACK_SETUP.md
- **Architecture Overview:** See ARCHITECTURE.md
