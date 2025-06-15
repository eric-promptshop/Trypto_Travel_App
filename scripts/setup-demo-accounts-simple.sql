-- Simple Demo Account Setup for Supabase
-- This script creates basic demo accounts without status fields

-- Clean up existing demo data
DELETE FROM "trips" WHERE "userId" = 'demo-traveler-001';
DELETE FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001');
DELETE FROM "users" WHERE id IN ('demo-traveler-001', 'demo-operator-001');

-- Create Demo Users
INSERT INTO "users" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES 
  ('demo-traveler-001', 'demo@example.com', 'Demo Traveler', 'USER', 'default', NOW(), NOW()),
  ('demo-operator-001', 'demo-operator@example.com', 'Demo Tour Operator', 'TOUR_OPERATOR', 'default', NOW(), NOW());

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
    'demo-operator-001', 
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
    'demo-trip-italy-' || gen_random_uuid()::text,
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
    'demo-trip-japan-' || gen_random_uuid()::text,
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
    'demo-trip-peru-' || gen_random_uuid()::text,
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
  (SELECT COUNT(*) FROM "users" WHERE email IN ('demo@example.com', 'demo-operator@example.com')) as users_created,
  (SELECT COUNT(*) FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001')) as accounts_created,
  (SELECT COUNT(*) FROM "trips" WHERE "userId" = 'demo-traveler-001') as trips_created;