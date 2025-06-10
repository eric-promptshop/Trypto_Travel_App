#!/bin/bash

# Production Deployment Script
# This script handles the production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="production"
BRANCH="main"

echo -e "${BLUE}=== Production Deployment Script ===${NC}"
echo -e "${YELLOW}Environment: ${DEPLOYMENT_ENV}${NC}"
echo -e "${YELLOW}Branch: ${BRANCH}${NC}"
echo ""

# Pre-deployment checks
echo -e "${BLUE}Running pre-deployment checks...${NC}"

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "${RED}Error: Not on ${BRANCH} branch. Currently on ${CURRENT_BRANCH}${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${RED}Error: Uncommitted changes detected. Please commit or stash changes.${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${BLUE}Pulling latest changes...${NC}"
git pull origin $BRANCH

# Run validation
echo -e "${BLUE}Running validation suite...${NC}"
npm run validate

# Build the application
echo -e "${BLUE}Building application...${NC}"
npm run build

# Run production tests
echo -e "${BLUE}Running production tests...${NC}"
npm run test:ci

# Database migrations
echo -e "${BLUE}Running database migrations...${NC}"
echo -e "${YELLOW}Would you like to run database migrations? (y/n)${NC}"
read -r RUN_MIGRATIONS
if [ "$RUN_MIGRATIONS" = "y" ]; then
    npm run db:migrate
fi

# Deploy to Vercel
echo -e "${BLUE}Deploying to Vercel...${NC}"
vercel --prod

# Post-deployment tasks
echo -e "${BLUE}Running post-deployment tasks...${NC}"

# Verify deployment
echo -e "${BLUE}Verifying deployment...${NC}"
DEPLOYMENT_URL=$(vercel ls --prod | grep -E "https://.*vercel.app" | head -1 | awk '{print $2}')
if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    echo -e "${GREEN}URL: ${DEPLOYMENT_URL}${NC}"
    
    # Run smoke tests
    echo -e "${BLUE}Running smoke tests...${NC}"
    curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200" && \
        echo -e "${GREEN}✓ Homepage is accessible${NC}" || \
        echo -e "${RED}✗ Homepage is not accessible${NC}"
    
    curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" | grep -q "200" && \
        echo -e "${GREEN}✓ API health check passed${NC}" || \
        echo -e "${RED}✗ API health check failed${NC}"
else
    echo -e "${RED}Could not verify deployment${NC}"
fi

# Send deployment notification
echo -e "${BLUE}Sending deployment notification...${NC}"
# Add your notification logic here (Slack, Discord, email, etc.)

# Create deployment tag
echo -e "${BLUE}Creating deployment tag...${NC}"
TAG="deploy-$(date +%Y%m%d-%H%M%S)"
git tag -a "$TAG" -m "Production deployment on $(date)"
git push origin "$TAG"

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${YELLOW}Tag: ${TAG}${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo "  - Monitor application logs"
echo "  - Check error rates"
echo "  - Verify all features are working"
echo "  - Update status page if needed"