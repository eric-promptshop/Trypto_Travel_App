#!/bin/bash

# Travel Itinerary Builder - Deployment Script
# Usage: ./scripts/deploy.sh [environment] [branch]
# Environments: staging, production
# Example: ./scripts/deploy.sh production main

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-staging}"
BRANCH="${2:-develop}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="$PROJECT_DIR/logs/deployment_${ENVIRONMENT}_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
    exit 1
}

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment from branch $BRANCH"
    
    # Check prerequisites
    command -v git >/dev/null 2>&1 || error "Git is required but not installed"
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    
    cd "$PROJECT_DIR"
    
    # Run tests
    log "Running pre-deployment tests..."
    npm run lint || error "Linting failed"
    npm run type-check || error "Type checking failed"
    npm test -- --passWithNoTests || error "Unit tests failed"
    npm run build || error "Build test failed"
    success "All tests passed"
    
    # Deploy
    log "Deploying to $ENVIRONMENT..."
    if [ -n "${VERCEL_TOKEN:-}" ]; then
        if ! command -v vercel >/dev/null 2>&1; then
            npm install -g vercel
        fi
        
        VERCEL_FLAGS=""
        if [ "$ENVIRONMENT" = "production" ]; then
            VERCEL_FLAGS="--prod"
        fi
        
        vercel --token "$VERCEL_TOKEN" $VERCEL_FLAGS --yes || error "Deployment failed"
    else
        warning "VERCEL_TOKEN not set - manual deployment required"
    fi
    
    success "🎉 Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [environment] [branch]"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac