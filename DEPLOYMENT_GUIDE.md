# Chat Gateway PoC - Deployment Guide

## Quick Start Deployment Options

### Option 1: Docker (Recommended - Easiest)

**Prerequisites:**
- Docker installed

**Steps:**
```bash
# Build the image
docker build -t chat-gateway:latest .

# Run the container
docker run -p 3000:3000 \
  -e SLACK_BOT_TOKEN=xoxb-... \
  -e SLACK_APP_TOKEN=xapp-... \
  -e SLACK_SIGNING_SECRET=xxx... \
  chat-gateway:latest
```

**Or with Docker Compose:**
```bash
# Create .env file with your credentials
cat > .env << EOF
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=xxx...
AGENT_INVOKE_URL=http://localhost:3000/api/agent
EOF

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

---

### Option 2: Manual Server Deployment

**Prerequisites:**
- Node.js 20+ installed
- npm installed

**Steps:**

1. **Build everything:**
```bash
# Backend build
cd backend
npm install
npm run build

# Frontend build
cd ../frontend
npm install
npm run build

cd ..
```

2. **Setup environment:**
```bash
# Create backend/.env with your credentials
cat > backend/.env << EOF
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=xxx...
AGENT_INVOKE_URL=http://your-server:3000/api/agent
TENANT_CONFIG_PATH=./src/gateway/tenant-config.ts
EOF
```

3. **Deploy backend:**
```bash
cd backend
npm ci --production  # Install production dependencies only
node dist/server.js
```

4. **Serve frontend (Option A - Use backend):**
Frontend builds to `dist/` - backend can serve it via static middleware.

5. **Or serve frontend separately (Option B):**
```bash
# Copy built frontend to web server (nginx, Apache, etc.)
cp -r frontend/dist /var/www/chat-gateway
```

---

### Option 3: Cloud Deployment (Azure App Service Example)

**Prerequisites:**
- Azure CLI installed
- Azure subscription

**Steps:**

1. **Create deployment files:**
   - Already have: `Dockerfile`, `docker-compose.yml`

2. **Push to container registry:**
```bash
# Login to Azure Container Registry
az acr login --name yourregistry

# Build and push
az acr build --registry yourregistry --image chat-gateway:latest .
```

3. **Deploy to App Service:**
```bash
# Create App Service
az appservice plan create \
  --name chat-gateway-plan \
  --resource-group myResourceGroup \
  --sku B2 --is-linux

az webapp create \
  --name chat-gateway-app \
  --plan chat-gateway-plan \
  --resource-group myResourceGroup \
  --deployment-container-image-name yourregistry.azurecr.io/chat-gateway:latest

# Configure environment variables
az webapp config appsettings set \
  --name chat-gateway-app \
  --resource-group myResourceGroup \
  --settings \
    SLACK_BOT_TOKEN=xoxb-... \
    SLACK_APP_TOKEN=xapp-... \
    SLACK_SIGNING_SECRET=xxx...
```

---

### Option 4: Kubernetes Deployment

**Create `k8s-deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: chat-gateway
  template:
    metadata:
      labels:
        app: chat-gateway
    spec:
      containers:
      - name: chat-gateway
        image: chat-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: SLACK_BOT_TOKEN
          valueFrom:
            secretKeyRef:
              name: slack-credentials
              key: bot-token
        - name: SLACK_APP_TOKEN
          valueFrom:
            secretKeyRef:
              name: slack-credentials
              key: app-token
        - name: SLACK_SIGNING_SECRET
          valueFrom:
            secretKeyRef:
              name: slack-credentials
              key: signing-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: chat-gateway-service
spec:
  selector:
    app: chat-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Deploy:**
```bash
# Create secrets
kubectl create secret generic slack-credentials \
  --from-literal=bot-token=xoxb-... \
  --from-literal=app-token=xapp-... \
  --from-literal=signing-secret=xxx...

# Deploy
kubectl apply -f k8s-deployment.yaml

# Monitor
kubectl logs -f deployment/chat-gateway
```

---

## Production Checklist

- [ ] Build backend with `npm run build`
- [ ] Build frontend with `npm run build`
- [ ] Set all environment variables (SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET)
- [ ] Configure AGENT_INVOKE_URL to your agent platform
- [ ] Test health endpoint: `GET /health`
- [ ] Test API endpoint: `POST /api/chat`
- [ ] Setup SSL/TLS (HTTPS) for production
- [ ] Configure firewall rules (allow port 3000)
- [ ] Setup monitoring and logging
- [ ] Setup auto-restart (systemd, supervisor, Docker restart policy)
- [ ] Configure backup strategy for session data
- [ ] Setup CI/CD pipeline for auto-deployment on git push

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Set to `production` for production |
| `PORT` | No | 3000 | Port to listen on |
| `SLACK_BOT_TOKEN` | Yes* | - | Slack bot token (xoxb-...) |
| `SLACK_APP_TOKEN` | Yes* | - | Slack app token (xapp-...) |
| `SLACK_SIGNING_SECRET` | Yes* | - | Slack signing secret |
| `AGENT_INVOKE_URL` | No | http://localhost:3000/api/agent | Agent platform URL |
| `TENANT_CONFIG_PATH` | No | ./src/gateway/tenant-config.ts | Tenant configuration path |

*Required only if using Slack channel

---

## Monitoring & Logging

**Health Check:**
```bash
curl http://your-server:3000/health
```

**View Logs (Docker):**
```bash
docker logs -f <container-id>
```

**View Logs (Docker Compose):**
```bash
docker-compose logs -f chat-gateway
```

---

## Troubleshooting

**Port already in use:**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

**Slack connection fails:**
- Verify SLACK_BOT_TOKEN is correct
- Verify SLACK_APP_TOKEN is correct
- Verify SLACK_SIGNING_SECRET is correct
- Check Slack workspace configuration

**Agent invocation fails:**
- Verify AGENT_INVOKE_URL is accessible
- Check network connectivity
- View application logs

---

## Post-Deployment

1. **Access the application:**
   - Web UI: http://your-server:3000
   - API: http://your-server:3000/api/...

2. **Test multi-tenancy:**
   - Open browser console
   - Change Tenant ID in settings
   - Verify sessions are isolated per tenant

3. **Test Slack integration:**
   - Send message to Slack bot
   - Verify response in channel

4. **Monitor sessions:**
   - GET /api/sessions shows all sessions
   - GET /api/sessions?tenantId=acme filters by tenant
