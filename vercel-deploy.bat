@echo off
REM Quick Vercel Deployment Script for Windows
REM Usage: vercel-deploy.bat

setlocal enabledelayedexpansion

echo 🚀 Preparing Chat Gateway for Vercel Deployment
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>&1
if !ERRORLEVEL! neq 0 (
  echo 📦 Installing Vercel CLI...
  npm i -g vercel
)

REM Check if vercel.json exists
if not exist "vercel.json" (
  echo ❌ vercel.json not found. Make sure you're in the project root.
  exit /b 1
)

echo ✅ Vercel CLI installed
echo.

echo 🔄 Pushing to GitHub...
git add -A
git commit -m "Deploy to Vercel: %DATE% %TIME%" 2>nul
git push origin main

echo.
echo 📋 Vercel Deployment Steps:
echo.
echo 1️⃣  Login to Vercel (if not already):
echo    vercel login
echo.
echo 2️⃣  Deploy to staging:
echo    vercel
echo.
echo 3️⃣  Deploy to production:
echo    vercel --prod
echo.
echo 4️⃣  View project dashboard:
echo    vercel --dashboard
echo.

pause

vercel

endlocal
