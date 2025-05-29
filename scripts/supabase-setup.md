# Supabase Setup Guide for Staging and Production

## Overview
You need to create two separate Supabase projects:
1. **Staging** - For testing and development
2. **Production** - For live application

## Step 1: Create Staging Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `travel-itinerary-builder-staging`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for setup to complete (2-3 minutes)

## Step 2: Get Staging Credentials

1. In your staging project dashboard
2. Go to **Settings > API**
3. Copy these values:
   - **Project URL** → `STAGING_SUPABASE_URL`
   - **anon public** key → `STAGING_SUPABASE_ANON_KEY`
   - **Database URL** (from Database settings) → `STAGING_DATABASE_URL`

## Step 3: Create Production Project

1. Click **"New Project"** again
2. Fill in details:
   - **Name**: `travel-itinerary-builder-production`
   - **Database Password**: Generate a different strong password
   - **Region**: Same as staging for consistency
3. Click **"Create new project"**
4. Wait for setup to complete

## Step 4: Get Production Credentials

1. In your production project dashboard
2. Go to **Settings > API**
3. Copy these values:
   - **Project URL** → `PRODUCTION_SUPABASE_URL`
   - **anon public** key → `PRODUCTION_SUPABASE_ANON_KEY`
   - **Database URL** → `PRODUCTION_DATABASE_URL`

## Step 5: Configure Database Schema

For both projects, you'll need to apply your database schema:

### Option A: Using Prisma (Recommended)
```bash
# Set environment variables for staging
export DATABASE_URL="your_staging_database_url"
npx prisma db push

# Set environment variables for production  
export DATABASE_URL="your_production_database_url"
npx prisma db push
```

### Option B: Using Supabase SQL Editor
1. Copy your schema from `supabase-schema.sql`
2. Go to **SQL Editor** in Supabase dashboard
3. Paste and run the schema

## Step 6: Enable Required Features

In both projects, enable these features:
1. **Authentication** > Settings
   - Enable email authentication
   - Configure OAuth providers (Google, GitHub, etc.)
2. **Database** > Extensions
   - Enable any required extensions
3. **Storage** (if needed)
   - Create buckets for file uploads

## Security Configuration

### Authentication Settings
1. Go to **Authentication > Settings**
2. Configure:
   - **Site URL**: Your app URLs
   - **Redirect URLs**: Add your auth callback URLs
   - **JWT expiry**: Set appropriate values

### RLS (Row Level Security)
1. Enable RLS on sensitive tables
2. Create policies for user access
3. Test policies thoroughly

## Verification

Test your setup:

```bash
# Test staging
curl "YOUR_STAGING_SUPABASE_URL/rest/v1/" \
  -H "apikey: YOUR_STAGING_ANON_KEY"

# Test production  
curl "YOUR_PRODUCTION_SUPABASE_URL/rest/v1/" \
  -H "apikey: YOUR_PRODUCTION_ANON_KEY"
```

## Final Checklist

- [ ] Staging project created
- [ ] Production project created
- [ ] Database schemas applied to both
- [ ] Authentication configured
- [ ] Required extensions enabled
- [ ] RLS policies configured
- [ ] Credentials copied to GitHub secrets
- [ ] Connection tests passed

## Next Steps

1. Add the Supabase credentials to your GitHub secrets
2. Test staging deployment
3. Test production deployment
4. Monitor application logs 