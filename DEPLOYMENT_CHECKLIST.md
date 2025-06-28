# Deployment Checklist for Service Architecture

## Pre-Deployment Checklist

### 1. Verify Local Changes
- [x] Service architecture implemented
- [x] Components updated with feature flags
- [x] GitHub Actions workflows created
- [x] Monitoring dashboard created
- [x] All documentation complete

### 2. Environment Setup Required
Before pushing to GitHub, ensure you have:

#### GitHub Repository Settings
- [ ] GitHub repository created/connected
- [ ] GitHub Actions enabled
- [ ] Following secrets added:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

#### Vercel Project Settings
- [ ] Vercel project created
- [ ] GitHub integration connected
- [ ] Environment variables configured:
  ```
  NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
  NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0
  NEXT_PUBLIC_ROLLOUT_STRATEGY=none
  ```

## Deployment Steps

### Step 1: Check Git Status
```bash
git status
git add .
git status
```

### Step 2: Create Deployment Commit
```bash
git commit -m "feat: implement service-oriented architecture with safe deployment

- Add Domain-Driven Design architecture with clean separation of concerns
- Implement Tour service with dependency injection (inversify)
- Create monitoring dashboard and health check endpoints
- Add GitHub Actions workflows for automated deployment
- Configure feature flags for zero-downtime rollout
- Update all components to support gradual migration

The new service is DISABLED by default. Enable with:
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true

Docs: See DEPLOYMENT_GUIDE.md for rollout instructions"
```

### Step 3: Push to GitHub
```bash
git push origin main
```

### Step 4: Monitor GitHub Actions
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Watch the "Deploy to Production" workflow
4. Verify all steps pass

### Step 5: Verify Deployment
Once deployment completes, check:

1. **Health Endpoint**
   ```bash
   curl https://YOUR-APP.vercel.app/api/v1/tours/health
   ```

2. **Old API Still Works**
   ```bash
   curl https://YOUR-APP.vercel.app/api/tour-operator/tours
   ```

3. **Monitoring Dashboard**
   Visit: `https://YOUR-APP.vercel.app/admin/monitoring`

## Post-Deployment Verification

### Expected Results:
- [ ] GitHub Action completes successfully
- [ ] Health check returns `{"status": "healthy"}`
- [ ] Old APIs continue to work
- [ ] Monitoring dashboard accessible
- [ ] No errors in Vercel logs

### If Deployment Fails:
1. Check GitHub Actions logs for errors
2. Verify all secrets are set correctly
3. Check Vercel dashboard for build errors
4. Review environment variables

## Next Steps After Successful Deployment

1. **Create a Test PR**
   ```bash
   git checkout -b test/new-service
   git push origin test/new-service
   ```
   This will deploy to staging with service ENABLED

2. **Test in Staging**
   - Use the preview URL from PR comment
   - Run through test checklist
   - Check performance metrics

3. **Begin Gradual Rollout**
   - Go to Actions → Deploy to Production
   - Run workflow with 10% rollout
   - Monitor dashboard

## Rollback Instructions (If Needed)

### Quick Rollback:
1. Go to Vercel Dashboard
2. Set `NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false`
3. Redeploy

### GitHub Actions Rollback:
1. Go to Actions → Deploy to Production
2. Run workflow with:
   - enable_new_service: false
   - rollout_percentage: 0

---

Remember: The new service is deployed DISABLED. This is safe!