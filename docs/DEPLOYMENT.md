# Deployment Documentation

## Overview

This document outlines the CI/CD pipeline and deployment process for the Travel Itinerary Builder application.

## Architecture

### Environments

1. **Development** - Local development with Docker Compose
2. **Staging** - Preview environment on Vercel (develop branch)
3. **Production** - Live environment on Vercel (main branch)

### Infrastructure Stack

- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Monitoring**: Health checks + Error tracking

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

Triggered on: Push to `main` or `develop`, Pull Requests

**Jobs:**
1. **Test Matrix** (Node.js 18.x, 20.x)
   - Install dependencies
   - TypeScript type checking
   - ESLint linting
   - Jest test suite with coverage
   - Application build

2. **Security Scan**
   - NPM security audit
   - Dependency vulnerability check

### Staging Deployment (`.github/workflows/deploy-staging.yml`)

Triggered on: Push to `develop` branch

**Process:**
1. Run full test suite
2. Build application with staging environment variables
3. Deploy to Vercel preview environment
4. Run database migrations
5. Execute smoke tests
6. Notify team via Slack

### Production Deployment (`.github/workflows/deploy-production.yml`)

Triggered on: Push to `main` branch

**Process:**
1. Enhanced testing (full coverage, linting, type checking)
2. Build with production environment variables
3. Deploy to Vercel production
4. Run database migrations
5. Execute comprehensive smoke tests
6. Create GitHub release
7. Notify team

## Environment Configuration

### Required Secrets

#### GitHub Repository Secrets

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Staging Environment
STAGING_DATABASE_URL=postgresql://...
STAGING_NEXTAUTH_URL=https://staging-domain.vercel.app
STAGING_NEXTAUTH_SECRET=staging_secret
STAGING_SUPABASE_URL=https://staging.supabase.co
STAGING_SUPABASE_ANON_KEY=staging_anon_key

# Production Environment
PRODUCTION_DATABASE_URL=postgresql://...
PRODUCTION_NEXTAUTH_URL=https://your-domain.com
PRODUCTION_NEXTAUTH_SECRET=production_secret
PRODUCTION_SUPABASE_URL=https://production.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=production_anon_key

# Notifications
SLACK_WEBHOOK=your_slack_webhook_url
```

### Environment Files

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Local Development

### Docker Compose Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

**Services:**
- `app`: Next.js application (port 3000)
- `db`: PostgreSQL database (port 5432)
- `redis`: Redis cache (port 6379)
- `pgadmin`: Database management UI (port 5050)

### Manual Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Deployment Commands

### Using the Deployment Script

```bash
# Development
./scripts/deploy.sh development

# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production
```

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to staging
vercel --env staging

# Deploy to production
vercel --prod
```

## Database Management

### Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (staging/production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup & Restore

```bash
# Backup production database
pg_dump $PRODUCTION_DATABASE_URL > backup.sql

# Restore to staging
psql $STAGING_DATABASE_URL < backup.sql
```

## Monitoring & Health Checks

### Health Check Endpoint

`GET /api/health`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "memory": {...},
    "uptime": 3600
  }
}
```

### Monitoring Setup

1. **Vercel Analytics** - Performance monitoring
2. **Sentry** - Error tracking
3. **GitHub Actions** - Build/deployment status
4. **Slack Notifications** - Deployment alerts

## Security Considerations

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets for each environment
- Rotate secrets regularly

### Database Security
- Use SSL connections
- Implement connection pooling
- Regular security audits

### Application Security
- Dependency vulnerability scanning
- Security headers configuration
- Rate limiting implementation

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify environment variables
   - Review dependency conflicts

2. **Deployment Failures**
   - Verify Vercel tokens
   - Check environment secrets
   - Review build logs

3. **Database Issues**
   - Verify connection strings
   - Check migration status
   - Review Prisma configuration

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Test database connection
npx prisma db push --force-reset

# Validate environment
./scripts/deploy.sh staging --dry-run
```

## Best Practices

### Development Workflow
1. Create feature branch from `develop`
2. Implement changes with tests
3. Submit PR to `develop`
4. Deploy to staging for testing
5. Merge to `main` for production

### Environment Management
- Keep environment files synchronized
- Test staging before production
- Use feature flags for gradual rollouts

### Database Management
- Always backup before migrations
- Test migrations on staging first
- Use descriptive migration names

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify environment configuration
4. Contact the development team 