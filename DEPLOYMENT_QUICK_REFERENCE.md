# Deployment Quick Reference

## 🚀 Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase connection
npm run setup:supabase

# 3. Push database schema
npm run db:push

# 4. Install Vercel CLI
npm i -g vercel

# 5. Configure Vercel environment
npm run vercel:setup
```

## 🔄 Environment Switching

```bash
# Switch to staging
npm run env:staging

# Switch to production  
npm run env:production

# Pull environment variables from Vercel
npm run vercel:pull
```

## 📤 Deployment Commands

```bash
# Deploy to staging/preview
npm run deploy:preview

# Deploy to production
npm run deploy:production

# Or use Vercel CLI directly
vercel              # Deploy to preview
vercel --prod       # Deploy to production
```

## 🗄️ Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset database (⚠️ WARNING: Deletes all data)
npm run db:reset
```

## 🔍 Vercel CLI Commands

```bash
# Login to Vercel
vercel login

# List deployments
vercel ls

# View logs
vercel logs

# List environment variables
vercel env ls

# Add environment variable
vercel env add KEY_NAME production

# Remove environment variable
vercel env rm KEY_NAME

# Pull env vars to .env.local
vercel env pull

# Promote deployment to production
vercel promote [deployment-url]

# Rollback deployment
vercel rollback [deployment-url]
```

## 🔐 Required Environment Variables

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### Authentication
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### APIs
- `OPENAI_API_KEY`
- `UNSPLASH_ACCESS_KEY` (optional)

### Cloudinary (optional)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Environment Control
- `NEXT_PUBLIC_ENVIRONMENT` (staging/production)

## 📝 GitHub Secrets for CI/CD

Add these to your GitHub repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL_PRODUCTION`

## 🚨 Common Issues

### Build Fails
- Check all environment variables are set
- Run `npm run type-check` locally
- Check build logs in Vercel dashboard

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check IP allowlist in Supabase
- Ensure service role key has correct permissions

### Environment Variables Not Working
- Restart deployment after changing variables
- Use `vercel env pull` to sync locally
- Check variable names match exactly

## 📚 Documentation

- [Supabase Setup](./SUPABASE_CONNECTION_GUIDE.md)
- [Vercel Deployment](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Main README](./README.md)