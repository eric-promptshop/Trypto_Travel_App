# Supabase Setup & Multi-Tenant Configuration

This document provides comprehensive instructions for setting up Supabase with our multi-tenant Travel CRM application.

## 🚀 Initial Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account/login
2. Create a new project:
   - **Project Name**: `travel-crm` (or your preferred name)
   - **Database Password**: Use a strong password (save it!)
   - **Region**: Choose closest to your users
3. Wait for the project to be provisioned (~2 minutes)

### 2. Get Connection Details

From your Supabase dashboard, navigate to Settings > API:

- **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
- **API Keys**:
  - `anon` key (public key)
  - `service_role` key (secret key - keep secure!)
- **Database URL**: Found in Settings > Database

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and update with your Supabase details:

```bash
# Database - Supabase Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 📦 Database Schema Deployment

### 1. Generate and Push Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (for development)
npx prisma db push

# Or create migrations (for production)
npx prisma migrate dev --name init
```

### 2. Run Seed Data

```bash
# Install dependencies if needed
npm install

# Run the seed script
npx prisma db seed
```

This creates:
- Demo tenant with admin and regular users
- Global and tenant-specific settings
- Trip templates
- Sample trip with activities

## 🔐 Row Level Security (RLS) Setup

### 1. Enable RLS on Tables

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tenant-isolated tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

```sql
-- Users can only access their own data within their tenant
CREATE POLICY "tenant_users_isolation" ON public.users
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
  AND (auth.uid()::text = id OR 
       EXISTS (SELECT 1 FROM public.users admin_check 
               WHERE admin_check.id = auth.uid()::text 
               AND admin_check.role = 'ADMIN' 
               AND admin_check.tenant_id = users.tenant_id))
);

-- Trips isolation through user relationship
CREATE POLICY "tenant_trips_isolation" ON public.trips
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = trips.user_id 
    AND users.tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
    AND (auth.uid()::text = users.id OR 
         EXISTS (SELECT 1 FROM public.users admin_check 
                 WHERE admin_check.id = auth.uid()::text 
                 AND admin_check.role = 'ADMIN' 
                 AND admin_check.tenant_id = users.tenant_id))
  )
);

-- Activities isolation through trip relationship
CREATE POLICY "tenant_activities_isolation" ON public.activities
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    JOIN public.users ON users.id = trips.user_id
    WHERE trips.id = activities.trip_id 
    AND users.tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
    AND (auth.uid()::text = users.id OR 
         EXISTS (SELECT 1 FROM public.users admin_check 
                 WHERE admin_check.id = auth.uid()::text 
                 AND admin_check.role = 'ADMIN' 
                 AND admin_check.tenant_id = users.tenant_id))
  )
);

-- Tenant settings isolation
CREATE POLICY "tenant_settings_isolation" ON public.tenant_settings
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
);
```

## 🗃️ Storage Setup

### 1. Create Storage Buckets

Create tenant-specific storage buckets for file uploads:

```sql
-- Create a function to set up tenant storage
CREATE OR REPLACE FUNCTION setup_tenant_storage(tenant_uuid uuid)
RETURNS void AS $$
DECLARE
  bucket_name text := 'tenant-' || tenant_uuid::text;
BEGIN
  -- Insert bucket (Supabase storage buckets table)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    bucket_name,
    bucket_name,
    false,
    52428800, -- 50MB
    ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create RLS policy for the bucket
  EXECUTE format('
    CREATE POLICY "tenant_storage_policy_%s" ON storage.objects
    FOR ALL USING (
      bucket_id = %L 
      AND auth.jwt() -> ''app_metadata'' -> ''tenant_id'' = %L
    )', tenant_uuid::text, bucket_name, tenant_uuid::text);
END;
$$ LANGUAGE plpgsql;

-- Set up storage for demo tenant (run after seeding)
SELECT setup_tenant_storage('your-demo-tenant-id-here');
```

### 2. Storage RLS Policies

```sql
-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- General storage policy (specific policies created per tenant)
CREATE POLICY "authenticated_users_storage" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');
```

## 🔄 Realtime Setup

### 1. Enable Realtime

In Supabase dashboard:
1. Go to Database > Replication
2. Enable replication for tables you want real-time updates:
   - `trips`
   - `activities` 
   - `trip_participants`

### 2. Client-side Subscription Example

```typescript
import { createTenantRealtimeSubscription } from '@/lib/supabase'

// Subscribe to trip changes for current tenant
const subscription = createTenantRealtimeSubscription(
  'trips',
  tenantId,
  (payload) => {
    console.log('Trip updated:', payload)
    // Update your UI state
  }
)

// Cleanup
subscription.unsubscribe()
```

## 🚀 Development Workflow

### Daily Development

```bash
# Start development server
npm run dev

# Reset database (if needed)
npx prisma migrate reset

# Re-seed database
npx prisma db seed
```

### Database Changes

```bash
# After modifying schema.prisma
npx prisma db push  # For development

# For production deployments
npx prisma migrate dev --name descriptive_name
npx prisma migrate deploy  # In production
```

## 🔧 Useful SQL Functions

### Check Tenant Isolation

```sql
-- Verify RLS is working
SET session.tenant_id = 'your-tenant-id';
SELECT * FROM users; -- Should only show users from your tenant

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Tenant Admin Functions

```sql
-- Create new tenant with admin user
CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  tenant_name text,
  tenant_slug text,
  admin_email text,
  admin_password text
) RETURNS uuid AS $$
DECLARE
  new_tenant_id uuid;
  hashed_password text;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, slug, is_active)
  VALUES (tenant_name, tenant_slug, true)
  RETURNING id INTO new_tenant_id;
  
  -- Hash password (in production, hash on application side)
  hashed_password := crypt(admin_password, gen_salt('bf'));
  
  -- Create admin user
  INSERT INTO users (email, name, password_hash, role, tenant_id, is_active)
  VALUES (admin_email, 'Admin', hashed_password, 'ADMIN', new_tenant_id, true);
  
  -- Set up storage
  PERFORM setup_tenant_storage(new_tenant_id);
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```sql
-- Check query performance
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%tenant%'
ORDER BY mean_exec_time DESC;

-- Index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE schemaname = 'public' AND tablename IN ('users', 'trips', 'activities');
```

### Data Analytics

Use Supabase's built-in analytics or connect to external tools:
- Built-in database analytics in Supabase dashboard
- Connect to Grafana for custom dashboards
- Use PostgREST for API analytics

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **RLS Policies**: Always test RLS policies thoroughly
3. **API Keys**: Use `anon` key for client-side, `service_role` only on server
4. **Tenant Isolation**: Always verify multi-tenant isolation in tests
5. **Backups**: Enable automatic backups in Supabase dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Connection Issues**: Check DATABASE_URL format and credentials
2. **RLS Blocking Queries**: Verify JWT contains correct tenant_id
3. **Migration Failures**: Check for constraint violations
4. **Storage Issues**: Verify bucket policies and file permissions

### Debug Commands

```bash
# Test database connection
npx prisma db pull

# Validate schema
npx prisma validate

# Check generated client
npx prisma generate

# Reset everything
npx prisma migrate reset --force
```

## 📞 Support

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- Check database logs in Supabase dashboard
- Use Supabase Discord community for support 