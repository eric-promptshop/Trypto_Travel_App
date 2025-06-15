-- Minimal Demo Account Setup - Users and Auth Only
-- This script creates only the user accounts without trips

-- First, ensure we have a default tenant
INSERT INTO "tenants" (id, name, slug, domain, "isActive", "createdAt", "updatedAt")
VALUES ('default', 'Default Tenant', 'default', 'default.example.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean up existing demo data
DELETE FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-agent-001');
DELETE FROM "users" WHERE id IN ('demo-traveler-001', 'demo-agent-001');

-- Create Demo Users with valid roles
INSERT INTO "users" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES 
  ('demo-traveler-001', 'demo@example.com', 'Demo Traveler', 'TRAVELER', 'default', NOW(), NOW()),
  ('demo-agent-001', 'demo-operator@example.com', 'Demo Tour Operator', 'AGENT', 'default', NOW(), NOW());

-- Create Authentication Accounts (password: demo123)
-- Using the bcrypt hash in the refresh_token field for credentials provider
INSERT INTO "accounts" (
  id, "userId", type, provider, "providerAccountId", 
  refresh_token
)
VALUES 
  (
    gen_random_uuid()::text, 
    'demo-traveler-001', 
    'credentials', 
    'credentials',
    'demo@example.com', 
    '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22'
  ),
  (
    gen_random_uuid()::text, 
    'demo-agent-001', 
    'credentials', 
    'credentials',
    'demo-operator@example.com', 
    '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22'
  );

-- Verify the setup
SELECT 
  'Demo accounts created successfully!' as message,
  (SELECT COUNT(*) FROM "tenants" WHERE id = 'default') as tenant_exists,
  (SELECT COUNT(*) FROM "users" WHERE email IN ('demo@example.com', 'demo-operator@example.com')) as users_created,
  (SELECT COUNT(*) FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-agent-001')) as accounts_created;

-- Show created users
SELECT id, email, name, role, "tenantId" FROM "users" WHERE id IN ('demo-traveler-001', 'demo-agent-001');

-- Note: Trips can be created through the application after logging in
-- The demo data will be shown from the hardcoded demo-trips.ts file