# Service Architecture Deployment Checklist

## Pre-Deployment Verification

### Code Readiness
- [x] Core infrastructure implemented (DI, Result type, error handling)
- [x] Tour domain fully implemented with all layers
- [x] Real service integrations (Auth, Email, Analytics, Logging)
- [x] API routes created at `/api/v1/tours/*`
- [x] React hooks created for frontend integration
- [x] Feature flag system implemented
- [x] Migration adapter for gradual rollout
- [x] Components updated to support both old and new implementations
- [x] Error handling UI components created
- [x] Loading states and skeletons implemented

### Testing
- [ ] Unit tests for domain models
- [ ] Integration tests for services
- [ ] API endpoint tests
- [ ] Component tests with mocked hooks
- [ ] End-to-end user flow tests
- [ ] Performance benchmarks

### Documentation
- [x] Architecture documentation (PROPOSED_SERVICE_ARCHITECTURE.md)
- [x] Migration plan (SERVICE_MIGRATION_PLAN.md)
- [x] Component migration guide (COMPONENT_MIGRATION_GUIDE.md)
- [x] API mapping documentation (TOUR_API_MIGRATION_MAP.md)
- [x] Migration checklist (TOUR_API_MIGRATION_CHECKLIST.md)
- [x] Status tracking (MIGRATION_PROGRESS.md)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Developer onboarding guide

## Deployment Steps

### 1. Environment Setup
```bash
# Add to .env.local (with feature flag DISABLED)
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false

# Verify all required environment variables
NEXTAUTH_URL=
NEXTAUTH_SECRET=
DATABASE_URL=
RESEND_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
SENTRY_DSN=
```

### 2. Database Preparation
- [ ] Backup production database
- [ ] Run any necessary migrations
- [ ] Verify database indexes for new queries
- [ ] Test rollback procedure

### 3. Initial Deployment (Feature Flag OFF)
```bash
# Deploy with feature flag disabled
git checkout main
git pull origin main
npm install
npm run build
npm run test

# Deploy to staging
npm run deploy:staging

# Smoke test old functionality
# - Create tour
# - List tours
# - Update tour
# - Delete tour
```

### 4. Feature Flag Testing (Staging)
```bash
# Enable feature flag in staging
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true

# Test new service endpoints
curl -X GET https://staging.tripnav.com/api/v1/tours
curl -X POST https://staging.tripnav.com/api/v1/tours -d '{...}'

# Run automated tests
npm run test:e2e -- --env=staging
```

### 5. Monitoring Setup
- [ ] Configure Sentry alerts for new error patterns
- [ ] Set up dashboard for key metrics:
  - API response times (old vs new)
  - Error rates by endpoint
  - Feature flag usage percentage
  - User engagement metrics
- [ ] Create PagerDuty alerts for critical failures
- [ ] Set up log aggregation queries

### 6. Gradual Production Rollout

#### Phase 1: Internal Testing (Day 1-3)
```javascript
// Enable for specific users
if (userEmail.endsWith('@tripnav.com')) {
  featureFlags.USE_NEW_TOUR_SERVICE = true;
}
```

#### Phase 2: 10% Rollout (Day 4-7)
```javascript
// Enable for 10% of users
const rolloutPercentage = 10;
const userHash = hashUserId(userId);
if (userHash % 100 < rolloutPercentage) {
  featureFlags.USE_NEW_TOUR_SERVICE = true;
}
```

#### Phase 3: 50% Rollout (Week 2)
- Monitor metrics closely
- Compare performance between old and new
- Address any issues found

#### Phase 4: 100% Rollout (Week 3)
- Enable for all users
- Keep monitoring for edge cases
- Prepare to remove old code

### 7. Success Criteria
- [ ] No increase in error rate (< 0.1% increase)
- [ ] API response time improvement or neutral (< 10ms regression)
- [ ] All automated tests passing
- [ ] No critical bug reports
- [ ] Positive or neutral user feedback

### 8. Rollback Plan
If issues arise at any stage:

1. **Immediate Rollback** (< 5 minutes)
   ```bash
   # Disable feature flag
   NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
   # Restart application
   npm run restart:production
   ```

2. **Investigation**
   - Check error logs in Sentry
   - Review metrics dashboard
   - Analyze user reports
   - Run diagnostic scripts

3. **Fix and Retry**
   - Create hotfix branch
   - Deploy fix to staging
   - Test thoroughly
   - Resume rollout

## Post-Deployment

### Week 4: Cleanup
- [ ] Remove old API routes
- [ ] Delete legacy implementation code
- [ ] Remove feature flags
- [ ] Update all documentation
- [ ] Archive migration guides

### Performance Optimization
- [ ] Analyze query patterns
- [ ] Optimize database indexes
- [ ] Review caching strategy
- [ ] Profile CPU/memory usage

### Team Knowledge Transfer
- [ ] Conduct architecture review session
- [ ] Create video walkthrough
- [ ] Update team wiki
- [ ] Plan next domain migration

## Emergency Contacts

- **On-Call Engineer**: Via PagerDuty
- **Database Admin**: [Contact]
- **DevOps Lead**: [Contact]
- **Product Manager**: [Contact]

## Useful Commands

```bash
# Check feature flag status
curl https://api.tripnav.com/api/monitoring/feature-flags

# Health check new service
curl https://api.tripnav.com/api/v1/tours/health

# Compare old vs new performance
npm run perf:compare -- --old=/api/tour-operator/tours --new=/api/v1/tours

# Generate migration report
npm run migration:report
```

## Sign-offs

- [ ] Engineering Lead
- [ ] QA Lead
- [ ] Product Manager
- [ ] DevOps Lead
- [ ] Security Review

---

**Remember**: This is a gradual migration. Take it slow, monitor carefully, and be ready to rollback if needed. The goal is zero user impact while improving the architecture.