# GitHub and Vercel Setup Guide

This guide walks you through setting up GitHub Actions and Vercel for automated deployment of the TripNav service architecture.

## Prerequisites

- GitHub repository for your project
- Vercel account with a project created
- GitHub Actions enabled in your repository

## Step 1: Vercel Setup

### 1.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build` (or `pnpm run build`)

### 1.2 Get Vercel Tokens

1. Go to [Account Settings](https://vercel.com/account/tokens)
2. Create a new token with name "GitHub Actions"
3. Copy the token (you'll need this for GitHub secrets)

### 1.3 Get Project and Org IDs

Run in your project directory:
```bash
npx vercel link
```

Then check `.vercel/project.json`:
```json
{
  "projectId": "prj_xxxxx",
  "orgId": "team_xxxxx"
}
```

### 1.4 Configure Environment Variables in Vercel

Go to your project settings → Environment Variables and add:

```bash
# Service flags (set all to false initially)
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false
NEXT_PUBLIC_USE_NEW_ITINERARY_SERVICE=false
NEXT_PUBLIC_USE_NEW_LEAD_SERVICE=false
NEXT_PUBLIC_USE_NEW_USER_SERVICE=false

# Rollout configuration
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0
NEXT_PUBLIC_ROLLOUT_STRATEGY=none
NEXT_PUBLIC_INTERNAL_USERS=["@tripnav.com"]

# Your existing environment variables
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
# ... etc
```

## Step 2: GitHub Setup

### 2.1 Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VERCEL_TOKEN` | Your Vercel token | From Step 1.2 |
| `VERCEL_ORG_ID` | Your org ID | From Step 1.3 |
| `VERCEL_PROJECT_ID` | Your project ID | From Step 1.3 |

### 2.2 Verify Workflow Files

Ensure these files exist in your repository:
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-staging.yml`

## Step 3: Initial Deployment

### 3.1 Push to Main Branch

```bash
git add .
git commit -m "feat: add service architecture with deployment workflows"
git push origin main
```

This will trigger the production deployment with the new service DISABLED.

### 3.2 Verify Deployment

1. Check GitHub Actions tab for workflow status
2. Once complete, verify:
   - Health endpoint: `https://your-app.vercel.app/api/v1/tours/health`
   - Old API still works: `https://your-app.vercel.app/api/tour-operator/tours`
   - Monitoring dashboard: `https://your-app.vercel.app/admin/monitoring`

## Step 4: Testing in Staging

### 4.1 Create a Pull Request

```bash
git checkout -b test/service-architecture
git push origin test/service-architecture
```

Create a PR on GitHub. This will:
- Deploy to staging with new service ENABLED
- Add a comment with test URLs
- Run all tests

### 4.2 Test New Service

Use the staging URL from the PR comment to test:
- Create, read, update, delete tours
- Check email notifications
- Verify analytics tracking
- Run performance tests

## Step 5: Gradual Production Rollout

### 5.1 Manual Workflow Dispatch

1. Go to Actions → "Deploy to Production"
2. Click "Run workflow"
3. Set parameters:
   - `enable_new_service`: false (keep disabled)
   - `rollout_percentage`: 10 (start with 10%)
4. Run workflow

### 5.2 Monitor Rollout

Check the monitoring dashboard at:
`https://your-app.vercel.app/admin/monitoring`

### 5.3 Increase Rollout

Repeat Step 5.1 with increasing percentages:
- 10% → 25% → 50% → 100%

## Step 6: Enable Full Service

Once confident, run the workflow with:
- `enable_new_service`: true
- `rollout_percentage`: 100

## Troubleshooting

### Build Failures

Check if all dependencies are installed:
```json
// package.json
{
  "dependencies": {
    "reflect-metadata": "^0.1.13",
    "inversify": "^6.0.1"
  }
}
```

### Environment Variable Issues

Verify in Vercel dashboard:
- Environment variables are set for correct environments
- Variable names match exactly (case-sensitive)

### Health Check Failures

Test locally:
```bash
npm run dev
curl http://localhost:3000/api/v1/tours/health
```

## Rollback Procedure

If issues arise:

1. **Quick Rollback via Vercel Dashboard**:
   - Go to project settings
   - Set `NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false`
   - Redeploy

2. **Rollback via GitHub Actions**:
   - Run workflow with:
     - `enable_new_service`: false
     - `rollout_percentage`: 0

## Security Notes

- Never commit secrets to the repository
- Use GitHub Secrets for all sensitive values
- Rotate tokens periodically
- Use branch protection rules for main branch

## Next Steps

1. Monitor initial deployment
2. Run staging tests
3. Begin gradual rollout
4. Monitor metrics continuously
5. Complete migration when stable

---

For support, check:
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Your monitoring dashboard: `/admin/monitoring`