# Vercel Deployment Guide

This guide covers deploying the Travel Itinerary Builder to Vercel with proper environment configuration for staging and production.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
4. **Supabase Projects**: Both staging and production Supabase projects configured

## Deployment Options

### Option 1: Automatic Deployment (Recommended)

1. **Connect Repository to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the branch for deployment (e.g., `main` for production, `develop` for staging)

2. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables** (see Environment Variables section below)

4. **Deploy**: Click "Deploy" and Vercel will build and deploy your app

### Option 2: CLI Deployment

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Run Setup Script**:
   ```bash
   npm run vercel:setup
   ```
   This interactive script will help you set all required environment variables.

3. **Deploy**:
   ```bash
   # Deploy to preview (staging)
   vercel

   # Deploy to production
   vercel --prod
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENVIRONMENT` | Current environment | `staging` or `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `NEXTAUTH_URL` | Your app's URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | Generate with `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefg...` |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key | `your-access-key` |

### Setting Environment Variables

#### Via Vercel Dashboard:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add each variable with appropriate values
4. Select which environments should use each variable:
   - Production
   - Preview (staging)
   - Development

#### Via CLI:

Use the provided setup script:
```bash
./scripts/vercel-env-setup.sh
```

Or manually:
```bash
# Add a variable for production
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Add a variable for all environments
vercel env add OPENAI_API_KEY production preview development
```

## Multiple Environment Setup

### Production Deployment

1. **Main Branch**: Configure Vercel to deploy `main` branch to production
2. **Environment Variables**: Set production-specific values
3. **Domain**: Add your custom domain in Vercel settings

### Staging Deployment

1. **Preview Branch**: Configure `develop` branch for preview deployments
2. **Environment Variables**: Set staging-specific values
3. **Preview URL**: Use Vercel's preview URLs or add a staging subdomain

### Environment-Specific Configuration

The app automatically detects the environment based on `NEXT_PUBLIC_ENVIRONMENT`:

```typescript
// In your code
const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
const supabaseUrl = isProduction 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION
  : process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING
```

## Deployment Workflow

### Initial Setup

1. **Fork/Clone the repository**
2. **Create Supabase projects** (staging and production)
3. **Configure environment variables** using the setup script
4. **Connect to Vercel** via GitHub integration
5. **Deploy**

### Continuous Deployment

1. **Development**: Work on `develop` branch
2. **Staging**: Push to `develop` → Auto-deploy to preview
3. **Production**: Merge to `main` → Auto-deploy to production

## Build Configuration

The project includes `vercel.json` with optimized settings:

- **Build caching** for faster deployments
- **Function timeouts** for AI endpoints (30 seconds)
- **Security headers** for production
- **Region selection** (US East by default)

## Post-Deployment

### 1. Verify Deployment

- Check deployment logs in Vercel dashboard
- Visit your deployment URL
- Test critical features:
  - Homepage loads
  - AI chat works
  - Database connections work
  - Authentication flows

### 2. Set Up Monitoring

- Enable Vercel Analytics
- Set up error tracking (e.g., Sentry)
- Configure uptime monitoring

### 3. Configure Domain

For production:
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed
4. Enable HTTPS (automatic)

## Troubleshooting

### Build Failures

1. **Check build logs** in Vercel dashboard
2. **Common issues**:
   - Missing environment variables
   - TypeScript errors
   - Dependency issues

### Runtime Errors

1. **Check function logs** in Vercel dashboard
2. **Common issues**:
   - Database connection errors
   - API rate limits
   - Missing permissions

### Environment Variable Issues

- Ensure all required variables are set
- Check for typos in variable names
- Verify different values for staging/production
- Restart deployment after changing variables

## Performance Optimization

1. **Enable Vercel Edge Functions** for faster API responses
2. **Use Vercel Image Optimization** (automatic with Next.js)
3. **Configure caching headers** in `vercel.json`
4. **Enable Vercel Analytics** to monitor performance

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use different API keys** for staging and production
3. **Enable Vercel's DDoS protection**
4. **Set up proper CORS headers**
5. **Use environment-specific service accounts**

## Useful Commands

```bash
# View all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# View deployment logs
vercel logs

# List all deployments
vercel ls

# Promote a deployment to production
vercel promote [deployment-url]

# Roll back to a previous deployment
vercel rollback [deployment-url]
```

## CI/CD Integration

For GitHub Actions integration, see `.github/workflows/` directory for:
- Automated testing before deployment
- Environment-specific deployments
- Database migrations

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- Project issues: [GitHub Issues](https://github.com/your-repo/issues)