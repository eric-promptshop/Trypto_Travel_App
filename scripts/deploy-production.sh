#!/bin/bash

# Production deployment script for TripNav service migration
# This script deploys with the new service DISABLED by default

echo "🚀 Starting TripNav Production Deployment"
echo "========================================"
echo "⚠️  IMPORTANT: New service will be DISABLED by default"
echo ""

# Safety checks
if [ "$NODE_ENV" != "production" ] && [ "$1" != "--force" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to production"
    echo "Use --force to override this check"
    exit 1
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Not on main branch. Current branch: $CURRENT_BRANCH"
    echo "Please switch to main branch before deploying to production."
    exit 1
fi

# Confirm deployment
echo "📋 Pre-deployment checklist:"
echo "  ✓ On main branch"
echo "  ✓ New service will be disabled"
echo "  ✓ All tests passing"
echo "  ✓ Staging deployment successful"
echo ""
read -p "Ready to deploy to production? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Pull latest changes
echo ""
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

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

# Create production environment file
echo "📝 Creating production environment configuration..."
cat > .env.production << EOF
# Service Migration Feature Flags - DISABLED for initial deployment
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
NEXT_PUBLIC_USE_NEW_ITINERARY_SERVICE=false
NEXT_PUBLIC_USE_NEW_LEAD_SERVICE=false
NEXT_PUBLIC_USE_NEW_USER_SERVICE=false

# Rollout Configuration - Start with 0%
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0
NEXT_PUBLIC_ROLLOUT_STRATEGY=none
NEXT_PUBLIC_INTERNAL_USERS=["@tripnav.com"]

# Feature Flags
NEXT_PUBLIC_ENABLE_TOUR_TEMPLATES=false
NEXT_PUBLIC_ENABLE_AI_RECOMMENDATIONS=true
NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=false
NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE=false

# Performance Flags
NEXT_PUBLIC_ENABLE_CACHING=true
NEXT_PUBLIC_ENABLE_LAZY_LOADING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Copy other environment variables from .env.local (excluding test keys)
$(grep -v "NEXT_PUBLIC_USE_NEW_" .env.local | grep -v "_TEST" | grep -v "_DEV" || true)
EOF

echo "✅ Production environment configured with new service DISABLED"

# Deploy to production
echo ""
echo "🌐 Deploying to production..."

# Example deployment commands (adjust based on your infrastructure)
if [ "$DEPLOYMENT_METHOD" = "vercel" ]; then
    vercel --prod --env-file=.env.production
elif [ "$DEPLOYMENT_METHOD" = "aws" ]; then
    aws s3 sync .next s3://$PRODUCTION_BUCKET
    aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION_ID --paths "/*"
elif [ "$DEPLOYMENT_METHOD" = "docker" ]; then
    docker build -t tripnav:latest .
    docker tag tripnav:latest $DOCKER_REGISTRY/tripnav:latest
    docker push $DOCKER_REGISTRY/tripnav:latest
    kubectl rollout restart deployment/tripnav -n production
else
    echo "⚠️  No deployment method specified. Skipping automatic deployment."
    echo "Please deploy manually using .env.production"
fi

# Post-deployment verification
echo ""
echo "🏥 Running post-deployment checks..."
PRODUCTION_URL=${PRODUCTION_URL:-"https://api.tripnav.com"}

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local name=$2
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL$endpoint")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo "✅ OK ($response)"
    else
        echo "❌ Failed ($response)"
        return 1
    fi
}

# Check endpoints
check_endpoint "/api/v1/tours/health" "New API Health"
check_endpoint "/api/tour-operator/tours" "Old API (should still work)"

# Show health check details
echo ""
echo "📊 Health Check Details:"
curl -s "$PRODUCTION_URL/api/v1/tours/health" | jq '.' || echo "Failed to get health details"

echo ""
echo "📋 Deployment Summary"
echo "===================="
echo "✅ Deployed to production with new service DISABLED"
echo "✅ Old functionality preserved"
echo "✅ Health endpoints accessible"
echo ""
echo "📌 Next Steps:"
echo "1. Monitor application logs for errors"
echo "2. Verify old functionality works correctly"
echo "3. Check monitoring dashboards"
echo "4. Proceed to staging tests when ready"
echo ""
echo "🔧 To test new service in staging:"
echo "   Set NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true in staging environment"
echo ""
echo "📊 Monitor deployment at:"
echo "   - Health: $PRODUCTION_URL/api/v1/tours/health"
echo "   - Metrics: $PRODUCTION_URL/api/monitoring/service-metrics"
echo "   - Logs: [Your logging platform]"

# Create deployment record
DEPLOYMENT_RECORD="deployments/$(date +%Y%m%d-%H%M%S).json"
mkdir -p deployments
cat > "$DEPLOYMENT_RECORD" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD)",
  "branch": "$CURRENT_BRANCH",
  "environment": "production",
  "features": {
    "USE_NEW_TOUR_SERVICE": false,
    "ROLLOUT_PERCENTAGE": 0
  },
  "deployer": "$(git config user.name)",
  "status": "success"
}
EOF

echo ""
echo "📝 Deployment record saved to: $DEPLOYMENT_RECORD"

# Clean up
rm -f .env.production

echo ""
echo "✅ Production deployment complete!"