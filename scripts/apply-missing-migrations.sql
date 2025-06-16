-- Apply missing migrations for Travel Itinerary Builder
-- This script creates all missing tables that are defined in Prisma schema but missing in database

-- 1. Create itineraries table (main missing table)
CREATE TABLE IF NOT EXISTS itineraries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  travelers INTEGER NOT NULL,
  "totalPrice" DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  days TEXT NOT NULL, -- JSON array of day plans
  metadata TEXT, -- JSON as string
  "leadId" TEXT,
  "userId" TEXT,
  "tenantId" TEXT DEFAULT 'default',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for itineraries
CREATE INDEX IF NOT EXISTS "itineraries_leadId_idx" ON itineraries("leadId");
CREATE INDEX IF NOT EXISTS "itineraries_userId_idx" ON itineraries("userId");
CREATE INDEX IF NOT EXISTS "itineraries_tenantId_idx" ON itineraries("tenantId");

-- 3. Create audit_logs table if missing
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON audit_logs("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_resourceId_idx" ON audit_logs("resourceId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON audit_logs("createdAt");

-- 5. Add missing columns to users table if they don't exist
DO $$ 
BEGIN
  -- Add isActive column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'isActive') THEN
    ALTER TABLE users ADD COLUMN "isActive" BOOLEAN DEFAULT true;
  END IF;
  
  -- Add tenantId column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'tenantId') THEN
    ALTER TABLE users ADD COLUMN "tenantId" TEXT DEFAULT 'default';
    CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON users("tenantId");
  END IF;
END $$;

-- 6. Add featured column to content table if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'content' AND column_name = 'featured') THEN
    ALTER TABLE content ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 7. Create foreign key constraints with proper error handling
DO $$ 
BEGIN
  -- Foreign key for itineraries -> tenants
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'itineraries_tenantId_fkey'
    ) THEN
      ALTER TABLE itineraries 
      ADD CONSTRAINT "itineraries_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END IF;

  -- Foreign key for audit_logs -> tenants
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'audit_logs_tenantId_fkey'
    ) THEN
      ALTER TABLE audit_logs 
      ADD CONSTRAINT "audit_logs_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END IF;

  -- Foreign key for audit_logs -> users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'audit_logs_userId_fkey'
  ) THEN
    ALTER TABLE audit_logs 
    ADD CONSTRAINT "audit_logs_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 8. Create update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for itineraries
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at 
BEFORE UPDATE ON itineraries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 9. Verify all tables exist
SELECT 
  'Migration Status Report' as report_title,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as users_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') as tenants_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') as trips_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') as leads_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'content') as content_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_content') as tenant_content_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'itineraries') as itineraries_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') as audit_logs_exists;

-- 10. Count records in key tables
SELECT 
  'Table Record Counts' as report_title,
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM trips) as trip_count,
  (SELECT COUNT(*) FROM leads) as lead_count,
  (SELECT COUNT(*) FROM content) as content_count,
  (SELECT COUNT(*) FROM itineraries) as itinerary_count;