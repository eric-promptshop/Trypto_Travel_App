-- Create itineraries table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "itineraries_leadId_idx" ON itineraries("leadId");
CREATE INDEX IF NOT EXISTS "itineraries_userId_idx" ON itineraries("userId");
CREATE INDEX IF NOT EXISTS "itineraries_tenantId_idx" ON itineraries("tenantId");

-- Add foreign key constraints if the referenced tables exist
DO $$ 
BEGIN
  -- Check if tenants table exists before adding foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    ALTER TABLE itineraries 
    ADD CONSTRAINT "itineraries_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, skip
    NULL;
END $$;

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;

-- Create new trigger
CREATE TRIGGER update_itineraries_updated_at 
BEFORE UPDATE ON itineraries 
FOR EACH ROW 
EXECUTE FUNCTION update_itineraries_updated_at();

-- Verify table was created
SELECT 
  'Itineraries table created successfully!' as message,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'itineraries') as itineraries_table_exists,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'itineraries';