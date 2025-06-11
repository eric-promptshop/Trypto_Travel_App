# Operational Runbook

This runbook contains procedures for common operational tasks and incident response.

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [System Overview](#system-overview)
3. [Common Operations](#common-operations)
4. [Incident Response](#incident-response)
5. [Troubleshooting](#troubleshooting)
6. [Disaster Recovery](#disaster-recovery)

## Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Lead Developer | Eric Gonzalez | eric@example.com | 24/7 |
| DevOps Lead | TBD | devops@example.com | Business hours |
| Database Admin | TBD | dba@example.com | On-call |
| Security Team | TBD | security@example.com | 24/7 |

**Escalation Path:**
1. On-call engineer
2. Team lead
3. Engineering manager
4. CTO

## System Overview

### Architecture Components
- **Frontend:** Next.js application on Vercel
- **API:** Next.js API routes
- **Database:** PostgreSQL (production) / SQLite (development)
- **Cache:** Redis (optional)
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry, Vercel Analytics

### Critical Services
1. Authentication service (NextAuth.js)
2. Database connections
3. External API integrations
4. Payment processing

## Common Operations

### 1. Deployment

**Production Deployment:**
```bash
# Automated deployment
./scripts/deploy-production.sh

# Manual deployment
git checkout main
git pull origin main
npm run validate
npm run build
vercel --prod
```

**Rollback:**
```bash
# Via Vercel dashboard
vercel rollback

# Via Git
git revert HEAD
git push origin main
```

### 2. Database Operations

**Backup Database:**
```bash
./scripts/backup-database.sh
```

**Restore Database:**
```bash
# From local backup
gunzip -c backups/database/backup_TIMESTAMP.sql.gz | psql $DATABASE_URL

# From S3 backup
aws s3 cp s3://bucket/backup.sql.gz - | gunzip | psql $DATABASE_URL
```

**Run Migrations:**
```bash
# Development
npm run db:migrate

# Production (with caution)
DATABASE_URL=$PROD_DATABASE_URL npm run db:migrate
```

### 3. Monitoring

**Check System Health:**
```bash
# API health check
curl https://your-domain.com/api/health

# Check logs
vercel logs --prod

# Check metrics
# Visit monitoring dashboard
```

**View Error Rates:**
1. Open Sentry dashboard
2. Check error frequency
3. Identify error patterns
4. Review stack traces

### 4. Cache Management

**Clear Cache:**
```bash
# Clear Vercel cache
vercel --prod --force

# Clear Redis cache (if using)
redis-cli FLUSHALL

# Clear CDN cache
# Via Vercel dashboard or API
```

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | Critical - Site down | < 15 min | Complete outage, data loss |
| P1 | High - Major feature broken | < 1 hour | Auth failure, payment issues |
| P2 | Medium - Feature degraded | < 4 hours | Slow performance, minor bugs |
| P3 | Low - Minor issue | < 24 hours | UI glitches, typos |

### Incident Response Process

1. **Detect** - Monitor alerts, user reports
2. **Assess** - Determine severity and impact
3. **Communicate** - Notify stakeholders
4. **Mitigate** - Apply immediate fixes
5. **Resolve** - Implement permanent solution
6. **Review** - Post-mortem analysis

### Response Procedures

#### Site Down (P0)

1. **Immediate Actions:**
   ```bash
   # Check deployment status
   vercel ls --prod
   
   # Check API health
   curl -I https://your-domain.com/api/health
   
   # Check database connection
   npm run db:studio
   ```

2. **Quick Fixes:**
   - Revert to last known good deployment
   - Scale up resources if needed
   - Enable maintenance mode

3. **Communication:**
   - Update status page
   - Notify users via email/social media
   - Keep stakeholders informed

#### Performance Degradation

1. **Identify Bottleneck:**
   ```bash
   # Check server metrics
   vercel logs --prod | grep "duration"
   
   # Check database queries
   # Enable query logging in Prisma
   ```

2. **Mitigation:**
   - Enable caching
   - Optimize database queries
   - Scale resources
   - Rate limit aggressive clients

#### Security Incident

1. **Immediate Response:**
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable additional logging

2. **Investigation:**
   - Review access logs
   - Check for data exposure
   - Identify attack vector

3. **Recovery:**
   - Patch vulnerabilities
   - Reset affected user sessions
   - Notify affected users

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Test connection
npm run db:studio

# Check connection string
echo $DATABASE_URL

# Verify network connectivity
nc -zv database-host 5432
```

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run type-check
```

#### Authentication Issues
```bash
# Verify environment variables
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Check session configuration
# Review lib/auth/config.ts
```

### Debug Commands

```bash
# Enable debug logging
export DEBUG=*
npm run dev

# Check process health
ps aux | grep node
lsof -i :3000

# Memory usage
node --inspect server.js
```

## Disaster Recovery

### Backup Strategy

- **Database:** Daily automated backups, 30-day retention
- **Code:** Git repository with tags for each deployment
- **Configuration:** Environment variables in secure vault
- **Media:** CDN with origin backup

### Recovery Procedures

#### Complete System Recovery

1. **Provision Infrastructure:**
   ```bash
   # Deploy fresh instance
   vercel --prod
   
   # Configure environment
   vercel env pull
   ```

2. **Restore Database:**
   ```bash
   # Latest backup
   ./scripts/restore-database.sh latest
   
   # Specific timestamp
   ./scripts/restore-database.sh 20240112_120000
   ```

3. **Verify Services:**
   - Run health checks
   - Test critical user flows
   - Monitor error rates

#### Data Recovery

1. **Identify Loss:**
   - Determine affected time range
   - List affected entities
   - Assess business impact

2. **Recovery Options:**
   - Restore from backup
   - Replay from audit logs
   - Manual data entry

3. **Validation:**
   - Verify data integrity
   - Cross-check with other systems
   - User acceptance testing

### RTO/RPO Targets

- **RTO (Recovery Time Objective):** 2 hours
- **RPO (Recovery Point Objective):** 24 hours

## Maintenance Procedures

### Scheduled Maintenance

1. **Announcement:**
   - 48-hour advance notice
   - Email notification
   - Status page update

2. **Procedure:**
   ```bash
   # Enable maintenance mode
   vercel env add MAINTENANCE_MODE true
   
   # Perform maintenance
   # ...
   
   # Disable maintenance mode
   vercel env rm MAINTENANCE_MODE
   ```

3. **Verification:**
   - Run smoke tests
   - Check monitoring
   - Confirm user access

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update
npm audit fix

# Test thoroughly
npm run test:all
```

## Appendix

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Monitoring Dashboard](https://sentry.io)
- [Status Page](https://status.your-domain.com)
- [Documentation](https://docs.your-domain.com)

### Scripts Location

All operational scripts are in `/scripts/`:
- `deploy-production.sh` - Production deployment
- `backup-database.sh` - Database backup
- `restore-database.sh` - Database restore
- `health-check.sh` - System health check

### Environment Variables

Critical environment variables:
- `DATABASE_URL` - Database connection
- `NEXTAUTH_SECRET` - Auth secret
- `SENTRY_DSN` - Error tracking
- `MAINTENANCE_MODE` - Maintenance flag