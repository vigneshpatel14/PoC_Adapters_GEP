#!/bin/bash

# Quick Vercel Deployment Script
# Usage: ./vercel-deploy.sh

set -e

echo "🚀 Preparing Chat Gateway for Vercel Deployment"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Installing Vercel CLI..."
  npm i -g vercel
fi

# Ensure we're in the project root
if [ ! -f "vercel.json" ]; then
  echo "❌ vercel.json not found. Make sure you're in the project root."
  exit 1
fi

echo "✅ Vercel CLI installed"
echo ""

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  You have uncommitted changes. Committing..."
  git add -A
  git commit -m "Deploy to Vercel: $(date +%Y-%m-%d_%H:%M:%S)"
fi

echo "🔄 Pushing to GitHub..."
git push origin main

echo ""
echo "📋 Vercel Deployment Steps:"
echo ""
echo "1️⃣  Login to Vercel:"
echo "   vercel login"
echo ""
echo "2️⃣  Deploy to staging:"
echo "   vercel"
echo ""
echo "3️⃣  Deploy to production:"
echo "   vercel --prod"
echo ""
echo "4️⃣  View project:"
echo "   vercel --dashboard"
echo ""

read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel
fi
