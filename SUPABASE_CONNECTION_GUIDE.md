# Supabase Connection Guide

This guide will help you connect your staging and production Supabase tables to the Travel Itinerary Builder application.

## Prerequisites

Before starting, ensure you have:
1. Two Supabase projects created (staging and production)
2. Access to both projects' dashboard
3. The following information from each project:
   - Project URL
   - Anon/Public Key
   - Service Role Key
   - Database URL

## Step 1: Get Your Supabase Credentials

For each Supabase project (staging and production):

1. Go to your Supabase Dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon/Public Key**: Found under "Project API keys"
   - **Service Role Key**: Found under "Project API keys" (keep this secret!)
4. Navigate to Settings > Database
5. Copy the **Connection String** (URI format)

## Step 2: Configure Environment Variables

### Option A: Use the Setup Script (Recommended)

Run the interactive setup script:

```bash
npm run setup:supabase
```

This will guide you through entering your credentials for either staging or production.

### Option B: Manual Configuration

1. Open `.env.local` in your editor
2. Replace the placeholder values with your actual credentials:

```env
# SUPABASE STAGING CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-role-key

# SUPABASE PRODUCTION CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL_PRODUCTION=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY_PRODUCTION=your-production-service-role-key

# Database URL (for the active environment)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Step 3: Set Up Database Schema

### For a New Supabase Project:

1. Push the schema to Supabase:
   ```bash
   npm run db:push
   ```

2. Seed initial data:
   ```bash
   npm run db:seed
   ```

### For an Existing Supabase Project:

1. Generate migrations:
   ```bash
   npm run db:migrate
   ```

2. Apply migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Step 4: Switch Between Environments

To switch between staging and production:

### Switch to Staging:
```bash
npm run env:staging
```

### Switch to Production:
```bash
npm run env:production
```

After switching, restart your development server:
```bash
npm run dev
```

## Step 5: Verify Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Supabase connection errors

3. Test the connection by visiting:
   - http://localhost:3000/api/health

## Step 6: Enable Row Level Security (RLS)

For production use, ensure RLS is enabled:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Policies
3. Run the SQL from `supabase-schema.sql` to set up RLS policies

## Database Scripts Reference

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio to view/edit data
- `npm run db:reset` - Reset database (WARNING: deletes all data)

## Troubleshooting

### Connection Refused
- Verify your DATABASE_URL is correct
- Check if your IP is allowlisted in Supabase

### Invalid API Key
- Ensure you're using the correct key (anon vs service role)
- Check for extra spaces or newlines in your keys

### Schema Mismatch
- Run `npm run db:push` to sync schema
- Or use `npm run db:reset` to start fresh (WARNING: deletes data)

### Environment Not Switching
- Ensure `.env.local` has the correct NEXT_PUBLIC_ENVIRONMENT value
- Restart your development server after switching

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use different service role keys for staging and production
3. Enable RLS policies before going to production
4. Regularly rotate your service role keys
5. Use environment-specific API keys in your CI/CD pipeline

## Next Steps

After connecting Supabase:

1. Test user authentication flows
2. Verify data persistence for trips and itineraries
3. Check that admin features work correctly
4. Test the multi-tenant functionality if applicable
5. Set up database backups in Supabase Dashboard

For more detailed information, see:
- [README-SUPABASE.md](./README-SUPABASE.md) - Multi-tenant setup guide
- [docs/WHITE_LABEL_IMPLEMENTATION.md](./docs/WHITE_LABEL_IMPLEMENTATION.md) - White label features
- [prisma/schema.prisma](./prisma/schema.prisma) - Database schema