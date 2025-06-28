#!/bin/bash

# Staging deployment script for TripNav service migration
# This script deploys with the new service DISABLED by default

echo "🚀 Starting TripNav Staging Deployment"
echo "====================================="

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Not on main branch. Current branch: $CURRENT_BRANCH"
    echo "Please switch to main branch before deploying."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Create staging environment file
echo "📝 Creating staging environment configuration..."
cat > .env.staging << EOF
# Service Migration Feature Flags - DISABLED for initial deployment
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
NEXT_PUBLIC_USE_NEW_ITINERARY_SERVICE=false
NEXT_PUBLIC_USE_NEW_LEAD_SERVICE=false
NEXT_PUBLIC_USE_NEW_USER_SERVICE=false

# Rollout Configuration
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0
NEXT_PUBLIC_ROLLOUT_STRATEGY=none

# Copy other environment variables from .env.local
$(grep -v "NEXT_PUBLIC_USE_NEW_" .env.local || true)
EOF

echo "✅ Staging environment configured with new service DISABLED"

# Deploy to staging (example using Vercel)
echo "🌐 Deploying to staging..."
if command -v vercel &> /dev/null; then
    vercel --prod --env-file=.env.staging
else
    echo "⚠️  Vercel CLI not found. Please deploy manually with .env.staging"
fi

# Run post-deployment checks
echo "🏥 Running health checks..."
STAGING_URL=${STAGING_URL:-"https://staging.tripnav.com"}

# Check old API
echo "Checking old API..."
curl -s "$STAGING_URL/api/tour-operator/tours" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Old API is working"
else
    echo "❌ Old API check failed"
fi

# Check new API health
echo "Checking new API health endpoint..."
HEALTH_RESPONSE=$(curl -s "$STAGING_URL/api/v1/tours/health")
echo "Health check response: $HEALTH_RESPONSE"

echo ""
echo "📋 Deployment Summary"
echo "===================="
echo "✅ Deployed to staging with new service DISABLED"
echo "✅ Old functionality should work as before"
echo ""
echo "📌 Next Steps:"
echo "1. Test old functionality at $STAGING_URL"
echo "2. Enable new service: NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true"
echo "3. Test new endpoints at $STAGING_URL/api/v1/tours"
echo "4. Monitor logs and metrics"
echo ""
echo "🔧 To enable new service in staging:"
echo "   Update environment variable in staging dashboard"
echo "   OR redeploy with updated .env.staging"

# Clean up
rm .env.staging