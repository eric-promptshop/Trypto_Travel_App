-- Setup Demo Accounts in Supabase (Fixed for lowercase table names)
-- Run this script in your Supabase SQL editor

-- Clean up existing demo data
DELETE FROM "leads" WHERE id IN ('demo-lead-1', 'demo-lead-2');
DELETE FROM "content" WHERE metadata::jsonb->>'createdBy' = 'demo-operator-001';
DELETE FROM "trips" WHERE "userId" = 'demo-traveler-001';
DELETE FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001');
DELETE FROM "users" WHERE id IN ('demo-traveler-001', 'demo-operator-001');

-- Create Demo Users
INSERT INTO "users" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES 
  ('demo-traveler-001', 'demo@example.com', 'Demo Traveler', 'USER', 'default', NOW(), NOW()),
  ('demo-operator-001', 'demo-operator@example.com', 'Demo Tour Operator', 'TOUR_OPERATOR', 'default', NOW(), NOW());

-- Create Authentication Accounts (password: demo123)
INSERT INTO "accounts" (
  id, "userId", type, provider, "providerAccountId", 
  refresh_token, access_token, expires_at, token_type, 
  scope, id_token, session_state
)
VALUES 
  (
    gen_random_uuid()::text, 'demo-traveler-001', 'credentials', 'credentials',
    'demo@example.com', '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22',
    NULL, NULL, NULL, NULL, NULL, NULL
  ),
  (
    gen_random_uuid()::text, 'demo-operator-001', 'credentials', 'credentials',
    'demo-operator@example.com', '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22',
    NULL, NULL, NULL, NULL, NULL, NULL
  );

-- Create Demo Trips
INSERT INTO "trips" (
  id, title, destination, "startDate", "endDate", 
  budget, travelers, "userId", "createdAt", "updatedAt"
)
VALUES 
  (
    'demo-trip-italy',
    'Italian Adventure',
    'Italy',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '40 days',
    4500,
    2,
    'demo-traveler-001',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'demo-trip-japan',
    'Japan Cultural Experience',
    'Japan',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '74 days',
    8000,
    4,
    'demo-traveler-001',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    'demo-trip-peru',
    'Peru & Machu Picchu Trek',
    'Peru',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '50 days',
    3200,
    3,
    'demo-traveler-001',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '50 days'
  );

-- Create Demo Content/Tours
INSERT INTO "content" (
  id, type, name, description, location, city, country,
  price, currency, duration, active, metadata, images,
  "createdAt", "updatedAt", "tenantId"
)
VALUES 
  (
    'demo-tour-italy-classic',
    'tour',
    'Classic Italy Tour',
    '10-day guided tour through Rome, Florence, and Venice with expert local guides',
    'Italy',
    'Rome',
    'Italy',
    2200,
    'USD',
    14400, -- 10 days in minutes
    true,
    '{"maxParticipants": 20, "operatorName": "Demo Tours", "included": ["Hotels", "Breakfast", "Guide", "Transport"], "highlights": ["Colosseum", "Vatican", "Uffizi Gallery", "Venice Canals"], "createdBy": "demo-operator-001"}',
    '["https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=800"]',
    NOW(),
    NOW(),
    'default'
  ),
  (
    'demo-tour-japan-culture',
    'tour',
    'Japan Cultural Journey',
    '14-day immersive experience in Japanese culture, temples, and traditions',
    'Japan',
    'Tokyo',
    'Japan',
    3500,
    'USD',
    20160, -- 14 days in minutes
    true,
    '{"maxParticipants": 16, "operatorName": "Demo Tours", "included": ["Hotels", "Breakfast", "Guide", "JR Pass"], "highlights": ["Mt Fuji", "Kyoto Temples", "Tokyo Tower", "Hiroshima Peace Memorial"], "createdBy": "demo-operator-001"}',
    '["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800"]',
    NOW(),
    NOW(),
    'default'
  ),
  (
    'demo-tour-peru-trek',
    'tour',
    'Peru Adventure Trek',
    '8-day Inca Trail and Machu Picchu expedition with certified guides',
    'Peru',
    'Cusco',
    'Peru',
    1800,
    'USD',
    11520, -- 8 days in minutes
    true,
    '{"maxParticipants": 12, "operatorName": "Demo Tours", "included": ["Camping", "Meals", "Guide", "Permits"], "highlights": ["Inca Trail", "Machu Picchu", "Sacred Valley", "Cusco"], "createdBy": "demo-operator-001"}',
    '["https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800"]',
    NOW(),
    NOW(),
    'default'
  );

-- Create Demo Leads for the tour operator
INSERT INTO "leads" (
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
    '["culture", "food", "history"]',
    '{}',
    '{}',
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
    '["culture", "temples", "nature"]',
    '{}',
    '{}',
    90,
    'contacted',
    'default',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  );

-- Verify the setup
SELECT 
  'Setup Complete!' as message,
  (SELECT COUNT(*) FROM "users" WHERE id IN ('demo-traveler-001', 'demo-operator-001')) as users_created,
  (SELECT COUNT(*) FROM "accounts" WHERE "userId" IN ('demo-traveler-001', 'demo-operator-001')) as accounts_created,
  (SELECT COUNT(*) FROM "trips" WHERE "userId" = 'demo-traveler-001') as trips_created,
  (SELECT COUNT(*) FROM "content" WHERE metadata::jsonb->>'createdBy' = 'demo-operator-001') as tours_created,
  (SELECT COUNT(*) FROM "leads" WHERE id IN ('demo-lead-1', 'demo-lead-2')) as leads_created;