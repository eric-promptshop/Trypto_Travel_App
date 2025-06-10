# Deployment Documentation - Travel Itinerary Builder

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Strategies](#deployment-strategies)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Deployment Procedures](#deployment-procedures)
7. [Configuration Management](#configuration-management)
8. [Database Migrations](#database-migrations)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [Rollback Procedures](#rollback-procedures)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)

## Overview

This document provides comprehensive guidance for deploying the Travel Itinerary Builder application across different environments using modern DevOps practices.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     GitHub Repository                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions CI/CD                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Build   │─▶│   Test   │─▶│  Deploy  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Dev Env  │  │ Staging  │  │Production│
│(Feature) │  │ (Develop)│  │  (Main)  │
└──────────┘  └──────────┘  └──────────┘
```

## Prerequisites

### Required Tools

```bash
# Check installed versions
node --version      # Required: 18.x or higher
npm --version       # Required: 8.x or higher
git --version       # Required: 2.x or higher
vercel --version    # Required: latest
```

### Installation Commands

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Vercel CLI
npm install -g vercel

# Install GitHub CLI (optional but recommended)
brew install gh  # macOS
# or
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
```

### Access Requirements

1. **GitHub Access**
   - Repository write access
   - Ability to manage GitHub Actions
   - Access to repository secrets

2. **Vercel Access**
   - Team member access
   - Deployment permissions
   - Environment variable management

3. **Database Access**
   - Supabase project access
   - Database connection strings
   - Migration permissions

## Environment Setup

### Environment Variables

Create environment-specific `.env` files:

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/travel_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
OPENAI_API_KEY=your-dev-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REDIS_URL=redis://localhost:6379

# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/travel_staging
NEXT_PUBLIC_APP_URL=https://staging.travelitinerary.com
# ... (staging-specific values)

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/travel_prod
NEXT_PUBLIC_APP_URL=https://app.travelitinerary.com
# ... (production-specific values)
```

### Secret Management

#### GitHub Secrets Setup

```bash
# Using GitHub CLI
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set NEXTAUTH_SECRET --body "your-secret"
gh secret set OPENAI_API_KEY --body "sk-..."
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
```

#### Vercel Environment Variables

```bash
# Set environment variables for production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add OPENAI_API_KEY production

# Set for preview/staging
vercel env add DATABASE_URL preview
```

## Deployment Strategies

### 1. Blue-Green Deployment

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Green Environment
        run: |
          vercel deploy --prod --alias green-${{ github.sha }}
          
      - name: Run Health Checks
        run: |
          npm run test:e2e -- --baseUrl=https://green-${{ github.sha }}.vercel.app
          
      - name: Switch Traffic
        if: success()
        run: |
          vercel alias set green-${{ github.sha }} ${{ inputs.environment }}.travelitinerary.com
```

### 2. Canary Deployment

```typescript
// middleware.ts for canary routing
export function middleware(request: NextRequest) {
  const canaryPercentage = 10; // 10% of traffic to canary
  const isCanary = Math.random() * 100 < canaryPercentage;
  
  if (isCanary && process.env.CANARY_DEPLOYMENT_URL) {
    return NextResponse.rewrite(
      new URL(request.url, process.env.CANARY_DEPLOYMENT_URL)
    );
  }
  
  return NextResponse.next();
}
```

### 3. Rolling Deployment

```bash
#!/bin/bash
# scripts/rolling-deploy.sh

INSTANCES=3
DEPLOYMENT_URL=""

for i in $(seq 1 $INSTANCES); do
  echo "Deploying instance $i..."
  
  # Deploy new version
  DEPLOYMENT_URL=$(vercel deploy --no-wait)
  
  # Health check
  curl -f "$DEPLOYMENT_URL/api/health" || exit 1
  
  # Update routing weight
  vercel alias set "$DEPLOYMENT_URL" "instance-$i.travelitinerary.com"
  
  # Wait before next instance
  sleep 30
done

# Update main alias
vercel alias set "$DEPLOYMENT_URL" "app.travelitinerary.com"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # Job 1: Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Linting
        run: npm run lint
      
      - name: Type Check
        run: npm run type-check
      
      - name: Code Formatting Check
        run: npm run format:check

  # Job 2: Testing
  test:
    runs-on: ubuntu-latest
    needs: quality
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Setup Test Database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: |
          npx prisma generate
          npx prisma db push
      
      - name: Run Unit Tests
        run: npm run test:unit -- --coverage
      
      - name: Run Integration Tests
        run: npm run test:integration
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # Job 3: Security Scanning
  security:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Security Audit
        run: npm audit --production
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'travel-itinerary-builder'
          path: '.'
          format: 'HTML'
      
      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: reports/

  # Job 4: Build & Deploy
  deploy:
    runs-on: ubuntu-latest
    needs: [quality, test, security]
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build Application
        run: npm run build
        env:
          NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Staging
        if: github.ref == 'refs/heads/develop'
        run: |
          vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --env=preview \
            --build-env NODE_ENV=staging \
            --meta githubCommitSha=${{ github.sha }} \
            --meta githubCommitRef=${{ github.ref }}
      
      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: |
          vercel deploy --prod \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --build-env NODE_ENV=production \
            --meta githubCommitSha=${{ github.sha }} \
            --meta githubCommitRef=${{ github.ref }}
      
      - name: Run Post-Deployment Tests
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            npm run test:e2e -- --baseUrl=https://app.travelitinerary.com
          else
            npm run test:e2e -- --baseUrl=https://staging.travelitinerary.com
          fi

  # Job 5: Post-Deployment
  post-deploy:
    runs-on: ubuntu-latest
    needs: deploy
    if: success()
    
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment Successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Complete* :rocket:\n*Environment:* ${{ github.ref == 'refs/heads/main' && 'Production' || 'Staging' }}\n*Version:* `${{ github.sha }}`\n*Deployed by:* ${{ github.actor }}"
                  }
                }
              ]
            }
      
      - name: Create GitHub Release
        if: github.ref == 'refs/heads/main'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release ${{ github.run_number }}
          body: |
            Changes in this release:
            - Commit: ${{ github.sha }}
            - Deployed to production
```

## Deployment Procedures

### 1. Local Development Deployment

```bash
# Clone repository
git clone https://github.com/your-org/travel-itinerary-builder.git
cd travel-itinerary-builder

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev

# Or use Docker
docker-compose up -d
```

### 2. Staging Deployment

```bash
# Automated via GitHub Actions on develop branch
git checkout develop
git merge feature/your-feature
git push origin develop

# Manual deployment
vercel deploy --env=preview --build-env NODE_ENV=staging

# Verify deployment
curl https://staging.travelitinerary.com/api/health
```

### 3. Production Deployment

```bash
# Create release branch
git checkout -b release/v1.2.3 develop

# Update version
npm version patch # or minor/major

# Create PR to main
gh pr create --base main --title "Release v1.2.3"

# After PR approval and merge
# Deployment happens automatically

# Manual deployment (emergency)
vercel deploy --prod --build-env NODE_ENV=production
```

### 4. Hotfix Deployment

```bash
# Create hotfix from main
git checkout -b hotfix/critical-fix main

# Make fixes and test
# ...

# Deploy directly to production
git push origin hotfix/critical-fix
gh pr create --base main --title "Hotfix: Critical issue"

# After merge, backport to develop
git checkout develop
git merge main
git push origin develop
```

## Configuration Management

### Environment-Specific Configurations

```typescript
// lib/config/environment.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    features: {
      aiChat: true,
      contentScraping: true,
      analytics: false
    }
  },
  staging: {
    apiUrl: 'https://staging-api.travelitinerary.com',
    features: {
      aiChat: true,
      contentScraping: true,
      analytics: true
    }
  },
  production: {
    apiUrl: 'https://api.travelitinerary.com',
    features: {
      aiChat: true,
      contentScraping: false, // Disabled in prod
      analytics: true
    }
  }
}[process.env.NODE_ENV || 'development'];
```

### Feature Flags

```typescript
// lib/features/flags.ts
export const featureFlags = {
  NEW_PRICING_ENGINE: process.env.FEATURE_NEW_PRICING === 'true',
  ENHANCED_AI_MODEL: process.env.FEATURE_ENHANCED_AI === 'true',
  BETA_FEATURES: process.env.FEATURE_BETA === 'true',
};

// Usage in components
if (featureFlags.NEW_PRICING_ENGINE) {
  return <NewPricingComponent />;
}
```

### Dynamic Configuration

```typescript
// lib/config/dynamic.ts
import { createClient } from '@supabase/supabase-js';

class ConfigurationManager {
  private cache = new Map();
  
  async get(key: string, defaultValue?: any) {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Fetch from database
    const { data } = await supabase
      .from('configurations')
      .select('value')
      .eq('key', key)
      .single();
    
    const value = data?.value || defaultValue;
    this.cache.set(key, value);
    
    return value;
  }
  
  async set(key: string, value: any) {
    await supabase
      .from('configurations')
      .upsert({ key, value, updated_at: new Date() });
    
    this.cache.set(key, value);
  }
}
```

## Database Migrations

### Migration Strategy

```bash
# Development migrations
npx prisma migrate dev --name add_user_preferences

# Generate migration for review
npx prisma migrate dev --create-only --name add_user_preferences

# Deploy migrations to staging/production
npx prisma migrate deploy
```

### Migration Workflow

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
        required: true
      migration:
        description: 'Migration name'
        required: true

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Backup Database
        run: |
          pg_dump ${{ secrets[format('{0}_DATABASE_URL', inputs.environment)] }} \
            > backup-$(date +%Y%m%d-%H%M%S).sql
          
      - name: Run Migration
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', inputs.environment)] }}
        run: |
          npx prisma migrate deploy
          
      - name: Verify Migration
        run: |
          npx prisma db pull
          npx prisma validate
```

### Rollback Procedures

```bash
#!/bin/bash
# scripts/rollback-migration.sh

ENVIRONMENT=$1
MIGRATION_NAME=$2

# Get the migration timestamp
TIMESTAMP=$(npx prisma migrate status | grep $MIGRATION_NAME | awk '{print $1}')

# Create rollback migration
cat > prisma/migrations/${TIMESTAMP}_rollback/migration.sql << EOF
-- Rollback migration for $MIGRATION_NAME
-- Add your rollback SQL here
EOF

# Apply rollback
DATABASE_URL=$DATABASE_URL npx prisma db execute --file prisma/migrations/${TIMESTAMP}_rollback/migration.sql

# Update migration history
npx prisma migrate resolve --rolled-back $TIMESTAMP
```

## Monitoring & Health Checks

### Health Check Implementation

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV,
    checks: {}
  };
  
  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = { status: 'up', latency: 0 };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = { status: 'down', error: error.message };
  }
  
  // Redis check
  try {
    await redis.ping();
    checks.checks.redis = { status: 'up' };
  } catch (error) {
    checks.checks.redis = { status: 'down', error: error.message };
  }
  
  // External APIs
  const apiChecks = await Promise.allSettled([
    checkOpenAI(),
    checkCloudinary(),
    checkSupabase()
  ]);
  
  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503
  });
}
```

### Deployment Monitoring

```typescript
// lib/monitoring/deployment.ts
export class DeploymentMonitor {
  async trackDeployment(version: string, environment: string) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        event: 'deployment',
        properties: {
          version,
          environment,
          timestamp: new Date().toISOString(),
          deployer: process.env.GITHUB_ACTOR
        }
      })
    });
  }
  
  async checkDeploymentHealth(url: string, retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) return true;
      } catch (error) {
        console.log(`Health check attempt ${i + 1} failed`);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error('Deployment health check failed');
  }
}
```

## Rollback Procedures

### Automated Rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
        required: true
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Vercel Deployment
        run: |
          # Find deployment by version
          DEPLOYMENT_ID=$(vercel list --token=${{ secrets.VERCEL_TOKEN }} \
            --meta version=${{ inputs.version }} \
            --json | jq -r '.[0].uid')
          
          # Promote old deployment
          vercel promote $DEPLOYMENT_ID \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_ORG_ID }}
          
      - name: Rollback Database
        if: inputs.environment == 'production'
        run: |
          # Restore from backup
          pg_restore -d ${{ secrets.PRODUCTION_DATABASE_URL }} \
            backups/backup-${{ inputs.version }}.sql
```

### Manual Rollback Steps

```bash
# 1. Identify the issue
vercel logs --follow

# 2. Find previous stable deployment
vercel list --prod

# 3. Rollback to previous version
vercel rollback [deployment-url]

# 4. Verify rollback
curl https://app.travelitinerary.com/api/health

# 5. Investigate and fix
git revert [commit-hash]
git push origin main
```

## Security Considerations

### Deployment Security Checklist

- [ ] Environment variables are properly encrypted
- [ ] Secrets are rotated regularly
- [ ] Database connections use SSL
- [ ] API keys have appropriate scopes
- [ ] Deployment logs don't contain sensitive data
- [ ] Build artifacts are signed
- [ ] Dependencies are scanned for vulnerabilities
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is enabled

### Secret Rotation

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Generate new secrets
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEW_DB_PASSWORD=$(openssl rand -base64 24)

# Update in Vercel
vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production <<< "$NEW_NEXTAUTH_SECRET"

# Update in GitHub
gh secret set NEXTAUTH_SECRET --body "$NEW_NEXTAUTH_SECRET"

# Trigger redeployment
vercel redeploy --prod
```

## Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

**Problem**: TypeScript or ESLint errors during build

```bash
# Debug locally
npm run build

# Check TypeScript
npm run type-check

# Fix linting issues
npm run lint:fix
```

#### 2. Database Connection Issues

**Problem**: Cannot connect to database after deployment

```bash
# Verify connection string
vercel env pull
cat .env.local | grep DATABASE_URL

# Test connection
npx prisma db pull

# Check SSL requirements
DATABASE_URL="${DATABASE_URL}?sslmode=require"
```

#### 3. Memory Issues

**Problem**: Serverless function memory limits

```json
// vercel.json
{
  "functions": {
    "app/api/generate-itinerary/route.ts": {
      "maxDuration": 30,
      "memory": 3008
    }
  }
}
```

#### 4. Cold Start Performance

**Problem**: Slow initial requests

```typescript
// Implement warming
export async function GET() {
  // Keep functions warm
  if (request.headers.get('x-warm-function')) {
    return new Response('OK', { status: 200 });
  }
  // Regular handler
}
```

### Debug Commands

```bash
# View recent deployments
vercel list

# Check deployment logs
vercel logs [deployment-url]

# Inspect environment variables
vercel env ls

# Check build output
vercel build --debug

# Test production build locally
vercel dev --prod

# Analyze bundle size
npm run analyze
```

### Performance Troubleshooting

```bash
# Check bundle size
npm run build -- --analyze

# Profile server-side rendering
ANALYZE=true npm run build

# Test performance
npm run lighthouse

# Check for memory leaks
node --inspect npm run dev
```

## Best Practices

### 1. Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Changelog updated

### 2. Deployment Communication

```markdown
## Deployment Notice Template

**Environment**: Production
**Version**: v1.2.3
**Scheduled Time**: 2024-01-20 10:00 UTC
**Expected Downtime**: None (zero-downtime deployment)
**Changes**:
- Feature: New pricing calculator
- Fix: Memory leak in image processing
- Performance: Optimized database queries

**Rollback Plan**: Automated rollback if health checks fail
**Contact**: devops@travelitinerary.com
```

### 3. Post-Deployment Verification

```bash
#!/bin/bash
# scripts/verify-deployment.sh

echo "Running post-deployment checks..."

# 1. Health check
curl -f https://app.travelitinerary.com/api/health || exit 1

# 2. Critical user flows
npm run test:e2e -- --grep "@critical"

# 3. Performance check
npm run lighthouse -- --only-categories=performance

# 4. Error rate monitoring
# Check error tracking dashboard

echo "Deployment verification complete!"
```

## Disaster Recovery

### Backup Strategy

```yaml
# .github/workflows/backup.yml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          pg_dump ${{ secrets.PRODUCTION_DATABASE_URL }} \
            | gzip > backup-$(date +%Y%m%d).sql.gz
          
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: us-east-1
          
      - name: Store Backup
        run: |
          aws s3 cp backup-*.sql.gz \
            s3://travel-backups/database/
```

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Download latest backup
   aws s3 cp s3://travel-backups/database/latest.sql.gz .
   
   # Restore
   gunzip -c latest.sql.gz | psql $DATABASE_URL
   ```

2. **Application Recovery**
   ```bash
   # Redeploy last known good version
   vercel rollback
   
   # Or deploy specific commit
   git checkout [commit-hash]
   vercel deploy --prod
   ```

## Support

For deployment assistance:
- **Documentation**: https://docs.travelitinerary.com/deployment
- **DevOps Team**: devops@travelitinerary.com
- **Emergency Hotline**: +1-xxx-xxx-xxxx (24/7 for production issues)