# TripNav Service Architecture Deployment Guide

This guide provides step-by-step instructions for deploying the new service architecture.

## Prerequisites

- [ ] All code merged to main branch
- [ ] Environment variables configured
- [ ] Team notified of deployment schedule
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboards accessible

## Step 1: Production Deployment (Feature Disabled)

### 1.1 Set Production Environment Variables

Add to your production environment:

```bash
# Feature flags - START WITH FALSE
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
NEXT_PUBLIC_ROLLOUT_STRATEGY=none
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0

# Keep all existing environment variables
# DATABASE_URL, NEXTAUTH_SECRET, etc.
```

### 1.2 Deploy to Production

```bash
# Deploy using your preferred method
npm run deploy:production

# OR using the staging script as reference
./scripts/deploy-staging.sh
```

### 1.3 Verify Deployment

```bash
# Check health endpoint (should work even with feature disabled)
curl https://api.tripnav.com/api/v1/tours/health

# Verify old endpoints still work
curl https://api.tripnav.com/api/tour-operator/tours
```

## Step 2: Staging Testing

### 2.1 Enable in Staging

Update staging environment:

```bash
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true
NEXT_PUBLIC_ROLLOUT_STRATEGY=all
```

### 2.2 Run Test Suite

```bash
# Run the service test
npx tsx scripts/test-new-tour-service.ts

# Run performance comparison
npx tsx scripts/performance-comparison.ts
```

### 2.3 Manual Testing Checklist

- [ ] Create a new tour
- [ ] List tours
- [ ] Update tour details
- [ ] Publish a tour
- [ ] Archive a tour
- [ ] Check email notifications
- [ ] Verify analytics tracking

## Step 3: Gradual Production Rollout

### 3.1 Internal Testing (Day 1-3)

Update production environment:

```bash
NEXT_PUBLIC_ROLLOUT_STRATEGY=internal
NEXT_PUBLIC_INTERNAL_USERS=["@tripnav.com"]
```

Monitor using:
```bash
# Check metrics
curl https://api.tripnav.com/api/monitoring/service-metrics?service=tour

# Use rollout manager
npx tsx scripts/rollout-manager.ts
```

### 3.2 10% Rollout (Day 4-7)

```bash
NEXT_PUBLIC_ROLLOUT_STRATEGY=percentage
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=10
```

Key metrics to monitor:
- API response times (target: <200ms p95)
- Error rates (target: <0.5%)
- User engagement (should remain stable)

### 3.3 50% Rollout (Week 2)

```bash
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=50
```

Compare metrics between old and new:
- Use performance comparison script
- Check Sentry for new error patterns
- Monitor database query performance

### 3.4 100% Rollout (Week 3)

```bash
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=100
# OR
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true
NEXT_PUBLIC_ROLLOUT_STRATEGY=all
```

## Step 4: Monitoring During Rollout

### 4.1 Real-time Monitoring

Dashboard URLs:
- Health Check: `/api/v1/tours/health`
- Service Metrics: `/api/monitoring/service-metrics`
- Sentry: [Your Sentry Dashboard URL]
- Analytics: [Your Analytics Dashboard URL]

### 4.2 Key Metrics

```bash
# Quick health check
curl https://api.tripnav.com/api/v1/tours/health | jq

# Service metrics
curl https://api.tripnav.com/api/monitoring/service-metrics?service=tour | jq
```

### 4.3 Alert Thresholds

- Error rate > 2%: Investigate immediately
- Response time > 500ms (p95): Check performance
- 5xx errors spike: Consider rollback

## Step 5: Rollback Procedure

If issues arise at any stage:

### 5.1 Immediate Rollback (< 5 minutes)

```bash
# Disable feature flag
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0

# Restart application
pm2 restart tripnav # or your process manager
```

### 5.2 Investigate Issues

1. Check error logs in Sentry
2. Review metrics dashboard
3. Analyze user reports
4. Run diagnostic queries

### 5.3 Fix and Retry

1. Create hotfix branch
2. Fix identified issues
3. Deploy to staging
4. Test thoroughly
5. Resume rollout from previous percentage

## Step 6: Post-Deployment Cleanup

After successful 100% rollout and 1 week of stability:

```bash
# Run cleanup script
./scripts/cleanup-legacy-code.sh

# This will:
# - Remove old API routes
# - Remove feature flags
# - Clean up migration code
# - Update documentation
```

## Useful Commands

### Health Checks

```bash
# New service health
curl https://api.tripnav.com/api/v1/tours/health

# Quick functionality test
curl -X GET https://api.tripnav.com/api/v1/tours \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitoring

```bash
# Check current rollout status
curl https://api.tripnav.com/api/monitoring/feature-flags

# View service metrics
curl https://api.tripnav.com/api/monitoring/service-metrics?service=tour&range=1h
```

### Testing

```bash
# Run service tests
npx tsx scripts/test-new-tour-service.ts

# Compare performance
npx tsx scripts/performance-comparison.ts

# Interactive rollout management
npx tsx scripts/rollout-manager.ts
```

## Troubleshooting

### Common Issues

1. **High Error Rate**
   - Check Sentry for stack traces
   - Verify all environment variables
   - Check database connection pool

2. **Slow Performance**
   - Review database queries
   - Check for N+1 queries
   - Verify caching is working

3. **Missing Features**
   - Ensure all components updated
   - Check feature flag values
   - Verify service bindings

### Emergency Contacts

- On-Call Engineer: [PagerDuty]
- Team Lead: [Contact]
- DevOps: [Contact]

## Success Criteria

The deployment is considered successful when:

- [ ] 100% of traffic on new service
- [ ] Error rate < 0.5%
- [ ] Response time < 200ms (p95)
- [ ] No increase in support tickets
- [ ] All automated tests passing
- [ ] 1 week of stable operation

## Final Notes

- Take it slow - there's no rush
- Monitor carefully at each stage
- Be ready to rollback if needed
- Document any issues found
- Celebrate when complete! 🎉

Remember: The goal is zero user impact while improving the architecture.