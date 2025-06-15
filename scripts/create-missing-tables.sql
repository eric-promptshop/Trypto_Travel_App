-- Create missing tables for tour operator demo

-- Create content table for tours/activities
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT,
  country TEXT,
  price DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  duration INTEGER,
  images TEXT NOT NULL,
  amenities TEXT,
  highlights TEXT,
  included TEXT,
  excluded TEXT,
  metadata TEXT,
  "tenantId" TEXT DEFAULT 'default',
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_location ON content(location);
CREATE INDEX IF NOT EXISTS idx_content_tenantId ON content("tenantId");

-- Create leads table for customer inquiries
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  destination TEXT NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  travelers INTEGER NOT NULL,
  "budgetMin" DOUBLE PRECISION NOT NULL,
  "budgetMax" DOUBLE PRECISION NOT NULL,
  interests TEXT NOT NULL,
  "tripData" TEXT NOT NULL,
  itinerary TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  "crmSyncStatus" TEXT,
  "crmSyncedAt" TIMESTAMP WITH TIME ZONE,
  "tenantId" TEXT DEFAULT 'default',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_tenantId ON leads("tenantId");

-- Verify tables were created
SELECT 'Tables created successfully!' as message,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'content') as content_table_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') as leads_table_exists;