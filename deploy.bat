@echo off
REM Chat Gateway PoC - Windows Production Deployment Script
REM Usage: deploy.bat [docker-compose|docker-run] [version]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
set VERSION=%2

if "!ENVIRONMENT!"=="" set ENVIRONMENT=docker-compose
if "!VERSION!"=="" set VERSION=latest

set IMAGE_NAME=chat-gateway

echo 🚀 Deploying Chat Gateway PoC
echo Environment: !ENVIRONMENT!
echo Version: !VERSION!
echo.

REM Step 1: Build
echo 📦 Building Docker image...
docker build -t !IMAGE_NAME!:!VERSION! .
docker tag !IMAGE_NAME!:!VERSION! !IMAGE_NAME!:latest

REM Step 2: Deploy
echo 🎯 Deploying to !ENVIRONMENT!...

if "!ENVIRONMENT!"=="docker-compose" (
  docker-compose down
  docker-compose up -d
  echo ✅ Deployed via Docker Compose
  docker-compose logs -f
) else if "!ENVIRONMENT!"=="docker-run" (
  docker stop chat-gateway >nul 2>&1 || true
  docker rm chat-gateway >nul 2>&1 || true
  docker run -d ^
    --name chat-gateway ^
    -p 3000:3000 ^
    --env-file backend\.env.production ^
    --restart unless-stopped ^
    !IMAGE_NAME!:!VERSION!
  echo ✅ Deployed via Docker Run
  docker logs -f chat-gateway
) else (
  echo ❌ Unknown environment: !ENVIRONMENT!
  echo Usage: deploy.bat [docker-compose^|docker-run] [version]
  exit /b 1
)

echo.
echo 🎉 Deployment complete!
echo.
echo 📊 Health Check:
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000/health

endlocal
