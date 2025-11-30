#!/bin/bash

# Chat Gateway PoC - Production Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
IMAGE_NAME="chat-gateway"
REGISTRY=${REGISTRY:-your-registry}

echo "🚀 Deploying Chat Gateway PoC"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo ""

# Step 1: Build
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME:$VERSION .
docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

# Step 2: Push to registry (optional)
if [ -n "$REGISTRY" ] && [ "$REGISTRY" != "your-registry" ]; then
  echo "📤 Pushing to registry..."
  docker tag $IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:$VERSION
  docker push $REGISTRY/$IMAGE_NAME:$VERSION
fi

# Step 3: Deploy
echo "🎯 Deploying to $ENVIRONMENT..."

case $ENVIRONMENT in
  docker-compose)
    docker-compose down || true
    docker-compose up -d
    echo "✅ Deployed via Docker Compose"
    docker-compose logs -f
    ;;
  
  docker-run)
    docker stop chat-gateway || true
    docker rm chat-gateway || true
    docker run -d \
      --name chat-gateway \
      -p 3000:3000 \
      --env-file backend/.env.production \
      --restart unless-stopped \
      $IMAGE_NAME:$VERSION
    echo "✅ Deployed via Docker Run"
    docker logs -f chat-gateway
    ;;
  
  kubernetes)
    kubectl set image deployment/chat-gateway \
      chat-gateway=$IMAGE_NAME:$VERSION \
      --record
    kubectl rollout status deployment/chat-gateway
    echo "✅ Deployed to Kubernetes"
    ;;
  
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: ./deploy.sh [docker-compose|docker-run|kubernetes] [version]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Health Check:"
sleep 2
curl -s http://localhost:3000/health | jq . || echo "Health check endpoint not ready yet"
