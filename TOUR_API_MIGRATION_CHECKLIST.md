# Tour API Migration Checklist

## Pre-Migration
- [ ] Backup database
- [ ] Review existing API usage in frontend
- [ ] Update environment variables
- [ ] Test new endpoints in development

## Migration Steps

### 1. Update Frontend Components
- [ ] Update calls to /api/tour-operator/tours
- [ ] Update calls to /api/tour-operator/tours/[tourId]
- [ ] Update calls to /api/tours/discover

### 2. Update API Clients
- [ ] Update SDK/client libraries
- [ ] Update mobile app API calls
- [ ] Update third-party integrations

### 3. Enable Feature Flag
```bash
# .env.local
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true
```

### 4. Monitor During Migration
- [ ] Check error rates
- [ ] Monitor response times
- [ ] Verify email notifications
- [ ] Check analytics tracking

### 5. Post-Migration
- [ ] Remove old API routes
- [ ] Update documentation
- [ ] Remove feature flags
- [ ] Archive old code

## Rollback Plan
1. Set feature flag to false
2. Restart application
3. Investigate issues
4. Fix and retry

## Monitoring Dashboard
- Sentry: Check for new errors
- Analytics: Monitor API usage
- Logs: Check for warnings