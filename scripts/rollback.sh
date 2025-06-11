#!/bin/bash

# Travel Itinerary Builder - Rollback Script
# Usage: ./scripts/rollback.sh [environment] [deployment-id]
# Example: ./scripts/rollback.sh production deploy-prod-20241201_143022

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-staging}"
DEPLOYMENT_ID="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ROLLBACK_LOG="$PROJECT_DIR/logs/rollback_${ENVIRONMENT}_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$ROLLBACK_LOG"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$ROLLBACK_LOG"
    exit 1
}

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Rollback functions
find_previous_deployment() {
    log "Finding previous deployment to rollback to..."
    
    if [ -n "$DEPLOYMENT_ID" ]; then
        log "Using specified deployment ID: $DEPLOYMENT_ID"
        return 0
    fi
    
    # List recent deployments from logs
    DEPLOYMENT_LOGS=$(find "$PROJECT_DIR/logs" -name "deployment_${ENVIRONMENT}_*.log" -type f | sort -r | head -5)
    
    if [ -z "$DEPLOYMENT_LOGS" ]; then
        error "No previous deployments found for environment: $ENVIRONMENT"
    fi
    
    echo "Recent deployments for $ENVIRONMENT:"
    echo "$DEPLOYMENT_LOGS" | while read -r log_file; do
        basename "$log_file" | sed 's/deployment_//' | sed 's/.log//'
    done
    
    # Use the second most recent (current is the failed one)
    PREVIOUS_LOG=$(echo "$DEPLOYMENT_LOGS" | sed -n '2p')
    if [ -n "$PREVIOUS_LOG" ]; then
        DEPLOYMENT_ID=$(basename "$PREVIOUS_LOG" | sed 's/deployment_//' | sed 's/.log//')
        log "Selected previous deployment: $DEPLOYMENT_ID"
    else
        error "No previous deployment found to rollback to"
    fi
}

perform_git_rollback() {
    log "Performing git rollback..."
    
    cd "$PROJECT_DIR"
    
    # Find the git tag for the deployment
    GIT_TAG="deploy-${ENVIRONMENT}-${DEPLOYMENT_ID#*_}"
    
    if git tag -l | grep -q "$GIT_TAG"; then
        log "Rolling back to git tag: $GIT_TAG"
        git checkout "$GIT_TAG"
        success "Git rollback completed"
    else
        warning "Git tag $GIT_TAG not found - rolling back to previous commit"
        git log --oneline -10
        read -p "Enter the commit hash to rollback to: " COMMIT_HASH
        git checkout "$COMMIT_HASH"
        success "Rolled back to commit: $COMMIT_HASH"
    fi
}

rollback_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Checking for database backup to restore..."
        
        # Find the backup file for this deployment
        BACKUP_FILE="$PROJECT_DIR/backups/pre_deploy_${DEPLOYMENT_ID#*_}.sql"
        
        if [ -f "$BACKUP_FILE" ]; then
            read -p "⚠️  Restore database from backup? This will overwrite current data. (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log "Restoring database from backup: $BACKUP_FILE"
                
                if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
                    psql "$DATABASE_URL" < "$BACKUP_FILE" || error "Database restore failed"
                    success "Database restored from backup"
                else
                    error "Database restore failed - psql not available or DATABASE_URL not set"
                fi
            else
                warning "Database restore skipped"
            fi
        else
            warning "No database backup found for deployment: $DEPLOYMENT_ID"
        fi
    fi
}

deploy_previous_version() {
    log "Deploying previous version..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies for the rolled-back version
    log "Installing dependencies..."
    npm ci
    
    # Run basic tests
    log "Running quick tests..."
    npm run lint || warning "Linting failed on rollback version"
    npm run type-check || warning "Type check failed on rollback version"
    npm run build || error "Build failed on rollback version"
    
    # Deploy the previous version
    log "Deploying rollback version..."
    if [ -n "${VERCEL_TOKEN:-}" ]; then
        if ! command -v vercel >/dev/null 2>&1; then
            npm install -g vercel
        fi
        
        VERCEL_FLAGS=""
        if [ "$ENVIRONMENT" = "production" ]; then
            VERCEL_FLAGS="--prod"
        fi
        
        vercel --token "$VERCEL_TOKEN" $VERCEL_FLAGS --yes || error "Rollback deployment failed"
        success "Rollback deployment completed"
    else
        error "VERCEL_TOKEN not set - cannot perform automatic rollback"
    fi
}

verify_rollback() {
    log "Verifying rollback deployment..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Determine the deployment URL
    DEPLOYMENT_URL=""
    if [ "$ENVIRONMENT" = "production" ]; then
        DEPLOYMENT_URL="${PRODUCTION_URL:-https://travelitinerary.com}"
    else
        DEPLOYMENT_URL="${STAGING_URL:-https://staging.travelitinerary.com}"
    fi
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        # Health check
        log "Running health check on rollback deployment..."
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" || echo "000")
        
        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "206" ]; then
            success "Rollback health check passed (HTTP $HTTP_STATUS)"
        else
            error "Rollback health check failed (HTTP $HTTP_STATUS)"
        fi
        
        # Basic functionality test
        curl -s "$DEPLOYMENT_URL" > /dev/null || warning "Homepage test failed on rollback"
        success "Rollback verification completed"
    else
        warning "No deployment URL configured - skipping rollback verification"
    fi
}

notify_rollback() {
    log "Sending rollback notifications..."
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        SLACK_MESSAGE="🔄 Rollback to $ENVIRONMENT completed\n• Environment: $ENVIRONMENT\n• Rolled back to: $DEPLOYMENT_ID\n• Timestamp: $(date)"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$SLACK_MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL" || warning "Slack notification failed"
    fi
    
    success "Rollback notifications sent"
}

# Main rollback flow
main() {
    log "Starting rollback for $ENVIRONMENT environment"
    
    # Validate environment
    case $ENVIRONMENT in
        staging|production)
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
            ;;
    esac
    
    # Confirm rollback
    read -p "⚠️  Are you sure you want to rollback $ENVIRONMENT? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Rollback cancelled"
    fi
    
    find_previous_deployment
    perform_git_rollback
    rollback_database
    deploy_previous_version
    verify_rollback
    notify_rollback
    
    success "🔄 Rollback completed successfully!"
    success "Environment $ENVIRONMENT has been rolled back to deployment: $DEPLOYMENT_ID"
    log "Rollback log saved to: $ROLLBACK_LOG"
}

# Show help
show_help() {
    echo "Travel Itinerary Builder - Rollback Script"
    echo ""
    echo "Usage: $0 [environment] [deployment-id]"
    echo ""
    echo "Arguments:"
    echo "  environment     Target environment (staging, production)"
    echo "  deployment-id   Specific deployment to rollback to (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 staging                                # Rollback staging to previous deployment"
    echo "  $0 production deploy-prod-20241201_143022 # Rollback production to specific deployment"
    echo ""
    echo "Prerequisites:"
    echo "  - Git repository with deployment tags"
    echo "  - Vercel CLI and VERCEL_TOKEN"
    echo "  - Database backup files (for production)"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        error "Environment required. Use -h for help."
        ;;
    *)
        main "$@"
        ;;
esac