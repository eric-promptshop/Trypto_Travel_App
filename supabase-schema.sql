-- Multi-tenant Travel CRM Database Schema for Supabase
-- This script creates the complete database schema with tenant isolation

-- Core tenant model for multi-tenancy
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global settings that apply to all tenants
CREATE TABLE IF NOT EXISTS public.global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant-specific settings with inheritance from global
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    overrides_global BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER', 'TRAVELER', 'AGENT');

-- Users table with tenant association
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    role user_role NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip status enum
CREATE TYPE trip_status AS ENUM ('PLANNED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- Main trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    budget DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    status trip_status NOT NULL DEFAULT 'PLANNED',
    is_public BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- Activity categories enum
CREATE TYPE activity_category AS ENUM ('FLIGHT', 'ACCOMMODATION', 'RESTAURANT', 'ATTRACTION', 'TRANSPORT', 'MEETING', 'ENTERTAINMENT', 'SHOPPING', 'OTHER');

-- Activities within trips
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    start_time TEXT,
    end_time TEXT,
    location TEXT,
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    category activity_category NOT NULL DEFAULT 'OTHER',
    is_booked BOOLEAN NOT NULL DEFAULT false,
    booking_ref TEXT,
    notes TEXT,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip participants (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.trip_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'PARTICIPANT',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Document types enum
CREATE TYPE document_type AS ENUM ('PASSPORT', 'VISA', 'TICKET', 'HOTEL', 'INSURANCE', 'OTHER');

-- Trip documents
CREATE TABLE IF NOT EXISTS public.trip_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type document_type NOT NULL DEFAULT 'OTHER',
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM providers enum
CREATE TYPE crm_provider AS ENUM ('HUBSPOT', 'SALESFORCE', 'ZOHO', 'PIPEDRIVE', 'OTHER');

-- CRM integrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider crm_provider NOT NULL,
    credentials JSONB NOT NULL,
    config JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    error_log TEXT,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip templates for recurring itineraries
CREATE TABLE IF NOT EXISTS public.trip_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    duration INTEGER,
    estimated_cost DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    activities JSONB,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, title)
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES public.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_documents_trip_id ON public.trip_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON public.integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trip_templates_tenant_id ON public.trip_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON public.global_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trip_documents_updated_at BEFORE UPDATE ON public.trip_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trip_templates_updated_at BEFORE UPDATE ON public.trip_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on tenant-specific tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tenant data
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

-- Trip participants isolation
CREATE POLICY "tenant_trip_participants_isolation" ON public.trip_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    JOIN public.users ON users.id = trips.user_id
    WHERE trips.id = trip_participants.trip_id 
    AND users.tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
  )
);

-- Trip documents isolation
CREATE POLICY "tenant_trip_documents_isolation" ON public.trip_documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    JOIN public.users ON users.id = trips.user_id
    WHERE trips.id = trip_documents.trip_id 
    AND users.tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
  )
);

-- Integrations isolation
CREATE POLICY "tenant_integrations_isolation" ON public.integrations
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
);

-- Trip templates isolation
CREATE POLICY "tenant_trip_templates_isolation" ON public.trip_templates
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
);

-- Audit logs isolation
CREATE POLICY "tenant_audit_logs_isolation" ON public.audit_logs
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' -> 'tenant_id')::uuid
);

-- Insert demo data
INSERT INTO public.tenants (name, slug, description, domain, is_active, settings) VALUES
('Demo Travel Agency', 'demo', 'Demo tenant for testing multi-tenant functionality', 'demo.travel-crm.local', true, 
 '{"branding": {"primaryColor": "#3B82F6", "logo": "/logos/demo-logo.png"}, "features": {"realTimeSync": true, "crmIntegration": true, "customBranding": true}}')
ON CONFLICT (slug) DO NOTHING;

-- Insert global settings
INSERT INTO public.global_settings (setting_key, setting_value, description) VALUES
('MAX_TRIP_DURATION_DAYS', '365', 'Maximum trip duration in days'),
('DEFAULT_CURRENCY', 'USD', 'Default currency for new trips'),
('MAX_FILE_SIZE_MB', '50', 'Maximum file upload size in MB')
ON CONFLICT (setting_key) DO NOTHING;

-- Success message
SELECT 'Multi-tenant Travel CRM schema deployed successfully!' as message; 