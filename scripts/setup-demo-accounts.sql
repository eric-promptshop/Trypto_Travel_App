-- Setup Demo Accounts in Supabase
-- Run this script in your Supabase SQL editor

-- Clean up existing demo data
DELETE FROM "Lead" WHERE id IN ('demo-lead-1', 'demo-lead-2');
DELETE FROM "Content" WHERE "createdBy" = 'demo-operator-001';
DELETE FROM "Trip" WHERE "userId" = 'demo-traveler-001';
DELETE FROM "Account" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001');
DELETE FROM "User" WHERE id IN ('demo-traveler-001', 'demo-operator-001');

-- Create Demo Users
INSERT INTO "User" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES 
  ('demo-traveler-001', 'demo@example.com', 'Demo Traveler', 'USER', 'default', NOW(), NOW()),
  ('demo-operator-001', 'demo-operator@example.com', 'Demo Tour Operator', 'TOUR_OPERATOR', 'default', NOW(), NOW());

-- Create Authentication Accounts (password: demo123)
INSERT INTO "Account" (
  id, "userId", type, provider, "providerAccountId", 
  refresh_token, access_token, expires_at, token_type, 
  scope, id_token, session_state
)
VALUES 
  (
    gen_random_uuid(), 'demo-traveler-001', 'credentials', 'credentials',
    'demo@example.com', '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22',
    NULL, NULL, NULL, NULL, NULL, NULL
  ),
  (
    gen_random_uuid(), 'demo-operator-001', 'credentials', 'credentials',
    'demo-operator@example.com', '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22',
    NULL, NULL, NULL, NULL, NULL, NULL
  );

-- Create Demo Trips
INSERT INTO "Trip" (id, title, description, "startDate", "endDate", location, status, "createdAt", "updatedAt", "userId")
VALUES 
  (
    'demo-trip-italy',
    'Italian Adventure',
    'A wonderful journey through Rome, Florence, and Venice',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '40 days',
    'Italy',
    'active',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days',
    'demo-traveler-001'
  ),
  (
    'demo-trip-japan',
    'Japan Cultural Experience',
    'Exploring Tokyo, Kyoto, and Osaka',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '74 days',
    'Japan',
    'draft',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days',
    'demo-traveler-001'
  ),
  (
    'demo-trip-peru',
    'Peru & Machu Picchu Trek',
    'Adventure through the Sacred Valley and ancient ruins',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '50 days',
    'Peru',
    'completed',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '50 days',
    'demo-traveler-001'
  );

-- Create Demo Content/Tours
INSERT INTO "Content" (
  id, "tenantId", type, name, description, location, city, country,
  price, currency, duration, active, metadata, "createdAt", "updatedAt",
  "createdBy", featured
)
VALUES 
  (
    'demo-tour-italy-classic',
    'default',
    'tour',
    'Classic Italy Tour',
    '10-day guided tour through Rome, Florence, and Venice with expert local guides',
    'Italy',
    'Rome',
    'Italy',
    2200,
    'USD',
    10,
    true,
    '{"maxParticipants": 20, "operatorName": "Demo Tours", "included": ["Hotels", "Breakfast", "Guide", "Transport"], "highlights": ["Colosseum", "Vatican", "Uffizi Gallery", "Venice Canals"]}'::jsonb,
    NOW(),
    NOW(),
    'demo-operator-001',
    true
  ),
  (
    'demo-tour-japan-culture',
    'default',
    'tour',
    'Japan Cultural Journey',
    '14-day immersive experience in Japanese culture, temples, and traditions',
    'Japan',
    'Tokyo',
    'Japan',
    3500,
    'USD',
    14,
    true,
    '{"maxParticipants": 16, "operatorName": "Demo Tours", "included": ["Hotels", "Breakfast", "Guide", "JR Pass"], "highlights": ["Mt Fuji", "Kyoto Temples", "Tokyo Tower", "Hiroshima Peace Memorial"]}'::jsonb,
    NOW(),
    NOW(),
    'demo-operator-001',
    true
  ),
  (
    'demo-tour-peru-trek',
    'default',
    'tour',
    'Peru Adventure Trek',
    '8-day Inca Trail and Machu Picchu expedition with certified guides',
    'Peru',
    'Cusco',
    'Peru',
    1800,
    'USD',
    8,
    true,
    '{"maxParticipants": 12, "operatorName": "Demo Tours", "included": ["Camping", "Meals", "Guide", "Permits"], "highlights": ["Inca Trail", "Machu Picchu", "Sacred Valley", "Cusco"]}'::jsonb,
    NOW(),
    NOW(),
    'demo-operator-001',
    false
  );

-- Create Demo Leads
INSERT INTO "Lead" (
  id, email, name, phone, destination, "startDate", "endDate",
  travelers, "budgetMin", "budgetMax", interests, "tripData",
  itinerary, score, status, "tenantId", "createdAt", "updatedAt"
)
VALUES 
  (
    'demo-lead-1',
    'john.doe@example.com',
    'John Doe',
    '+1234567890',
    'Italy',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '40 days',
    2,
    2000,
    3000,
    '["culture", "food", "history"]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    85,
    'new',
    'default',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'demo-lead-2',
    'jane.smith@example.com',
    'Jane Smith',
    '+0987654321',
    'Japan',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '74 days',
    4,
    3000,
    5000,
    '["culture", "temples", "nature"]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    90,
    'contacted',
    'default',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  );

-- Verify the setup
SELECT 
  'Setup Complete!' as message,
  (SELECT COUNT(*) FROM "User" WHERE id IN ('demo-traveler-001', 'demo-operator-001')) as users_created,
  (SELECT COUNT(*) FROM "Account" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001')) as accounts_created,
  (SELECT COUNT(*) FROM "Trip" WHERE "userId" = 'demo-traveler-001') as trips_created,
  (SELECT COUNT(*) FROM "Content" WHERE "createdBy" = 'demo-operator-001') as tours_created,
  (SELECT COUNT(*) FROM "Lead" WHERE id IN ('demo-lead-1', 'demo-lead-2')) as leads_created;