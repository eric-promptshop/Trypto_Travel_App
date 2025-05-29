# GitHub Secrets Setup Guide

## Overview
This guide helps you set up all required GitHub repository secrets for the Travel Itinerary Builder CI/CD pipeline.

## How to Add Secrets
1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Add each secret below

## Required Secrets

### 1. Vercel Integration (Required for Deployment)
```
VERCEL_TOKEN=vercel_token_from_dashboard
VERCEL_ORG_ID=team_zzmaF3XcZqsbHwE3hsOqteGP
VERCEL_PROJECT_ID=prj_lbwalD6lN4mtA5sVDdX6B6INiZVO
```

**To get VERCEL_TOKEN:**
1. Visit [Vercel Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name: "travel-itinerary-builder-ci"
4. Copy the generated token

### 2. Staging Environment Secrets
```
STAGING_DATABASE_URL=postgresql://user:pass@staging-host:5432/staging_db
STAGING_NEXTAUTH_URL=https://travel-itinerary-builder-git-develop-your-team.vercel.app
STAGING_NEXTAUTH_SECRET=staging_random_32_char_string
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
```

**To set up Staging Supabase:**
1. Create a new Supabase project for staging
2. Go to Settings > API
3. Copy Project URL and anon public key

### 3. Production Environment Secrets
```
PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-host:5432/prod_db
PRODUCTION_NEXTAUTH_URL=https://your-custom-domain.com
PRODUCTION_NEXTAUTH_SECRET=production_random_32_char_string
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

**To set up Production Supabase:**
1. Create a new Supabase project for production
2. Go to Settings > API  
3. Copy Project URL and anon public key

### 4. Optional: Slack Notifications
```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

**To get Slack webhook:**
1. Go to your Slack workspace
2. Create a new app or use existing
3. Add Incoming Webhooks feature
4. Create webhook for #deployments channel

## Security Best Practices

### NextAuth Secrets
Generate random 32-character strings:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use online generator
# Visit: https://generate-secret.vercel.app/32
```

### Database URLs
- Use different databases for staging/production
- Use strong passwords
- Enable SSL connections
- Restrict IP access when possible

### Environment URLs
- Staging: Use Vercel's automatic preview URLs or custom staging domain
- Production: Use your custom domain

## Verification Checklist

- [ ] VERCEL_TOKEN - Test with `vercel whoami`
- [ ] VERCEL_ORG_ID - Matches your team ID
- [ ] VERCEL_PROJECT_ID - Matches your project ID
- [ ] STAGING_DATABASE_URL - Test connection
- [ ] STAGING_SUPABASE_URL - Accessible
- [ ] PRODUCTION_DATABASE_URL - Test connection  
- [ ] PRODUCTION_SUPABASE_URL - Accessible
- [ ] All NEXTAUTH_SECRET values are unique
- [ ] SLACK_WEBHOOK - Test with curl (optional)

## Testing Secrets

After adding secrets, test the pipeline:

1. **Push to develop branch** - Should trigger staging deployment
2. **Push to main branch** - Should trigger production deployment
3. **Check Actions tab** - Verify workflows run successfully

## Troubleshooting

### Common Issues:
1. **"Invalid token"** - Regenerate Vercel token
2. **"Database connection failed"** - Check DATABASE_URL format
3. **"Supabase error"** - Verify project URLs and keys
4. **"Build failed"** - Check all environment variables are set

### Testing Individual Secrets:
```bash
# Test Vercel token
vercel whoami --token YOUR_TOKEN

# Test database connection
psql "YOUR_DATABASE_URL" -c "SELECT 1;"

# Test Supabase
curl "YOUR_SUPABASE_URL/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
```

## Next Steps

1. Set up all secrets listed above
2. Push a commit to `develop` branch to test staging deployment
3. Monitor GitHub Actions for any failures
4. Once staging works, merge to `main` for production deployment 