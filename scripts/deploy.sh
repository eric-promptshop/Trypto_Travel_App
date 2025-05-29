#!/bin/bash

# Deployment script for Travel Itinerary Builder
# Usage: ./scripts/deploy.sh [development|staging|production]

set -e

ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Error: Invalid environment. Use 'development', 'staging', or 'production'"
    exit 1
fi

# Load environment variables
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading environment from $ENV_FILE"
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: $ENV_FILE not found. Using default environment variables."
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required environment variables are set
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "SUPABASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Type checking
echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit

# Linting
echo "🔍 Running linting..."
npm run lint

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level=high

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️  Building application..."
npm run build

# Database migrations (only for staging and production)
if [[ "$ENVIRONMENT" != "development" ]]; then
    echo "🗃️  Running database migrations..."
    npx prisma migrate deploy
fi

# Environment-specific deployment
case $ENVIRONMENT in
    development)
        echo "🔧 Starting development server..."
        npm run dev
        ;;
    staging)
        echo "🚀 Deploying to staging..."
        vercel --token="$VERCEL_TOKEN" --env="$ENVIRONMENT"
        ;;
    production)
        echo "🚀 Deploying to production..."
        vercel --prod --token="$VERCEL_TOKEN"
        ;;
esac

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Post-deployment health check
if [[ "$ENVIRONMENT" != "development" ]]; then
    echo "🏥 Running health check..."
    sleep 30
    
    HEALTH_URL="${NEXTAUTH_URL}/api/health"
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        exit 1
    fi
fi 