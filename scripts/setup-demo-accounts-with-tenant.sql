-- Demo Account Setup with Tenant Creation
-- This script creates the default tenant first, then demo accounts

-- First, ensure we have a default tenant
INSERT INTO "tenants" (id, name, slug, domain, "isActive", "createdAt", "updatedAt")
VALUES ('default', 'Default Tenant', 'default', 'default.example.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean up existing demo data
DELETE FROM "trips" WHERE "userId" IN ('demo-traveler-001', 'demo-agent-001');
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

-- Create Demo Trips for the traveler
INSERT INTO "trips" (
  id, title, destination, "startDate", "endDate", 
  budget, travelers, "userId", "createdAt", "updatedAt"
)
VALUES 
  (
    'demo-trip-italy-' || substring(gen_random_uuid()::text, 1, 8),
    'Italian Adventure',
    'Italy',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '40 days',
    4500,
    2,
    'demo-traveler-001',
    NOW(),
    NOW()
  ),
  (
    'demo-trip-japan-' || substring(gen_random_uuid()::text, 1, 8),
    'Japan Cultural Experience',
    'Japan',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '74 days',
    8000,
    4,
    'demo-traveler-001',
    NOW(),
    NOW()
  ),
  (
    'demo-trip-peru-' || substring(gen_random_uuid()::text, 1, 8),
    'Peru & Machu Picchu Trek',
    'Peru',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '50 days',
    3200,
    3,
    'demo-traveler-001',
    NOW(),
    NOW()
  );

-- Verify the setup
SELECT 
  'Demo accounts created successfully!' as message,
  (SELECT COUNT(*) FROM "tenants" WHERE id = 'default') as tenant_exists,
  (SELECT COUNT(*) FROM "users" WHERE email IN ('demo@example.com', 'demo-operator@example.com')) as users_created,
  (SELECT COUNT(*) FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-agent-001')) as accounts_created,
  (SELECT COUNT(*) FROM "trips" WHERE "userId" = 'demo-traveler-001') as trips_created;

-- Show created users
SELECT id, email, name, role, "tenantId" FROM "users" WHERE id IN ('demo-traveler-001', 'demo-agent-001');