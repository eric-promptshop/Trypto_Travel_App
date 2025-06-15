-- Create Demo Users Migration
-- This migration adds demo accounts for both traveler and tour operator personas

-- First, check if users already exist and delete them if they do (for clean setup)
DELETE FROM "Account" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email IN ('demo@example.com', 'demo-operator@example.com')
);

DELETE FROM "User" WHERE email IN ('demo@example.com', 'demo-operator@example.com');

-- Create Demo Traveler User
INSERT INTO "User" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  'demo-traveler-001',
  'demo@example.com',
  'Demo Traveler',
  'USER',
  'default',
  NOW(),
  NOW()
);

-- Create Demo Tour Operator User
INSERT INTO "User" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  'demo-operator-001',
  'demo-operator@example.com',
  'Demo Tour Operator',
  'TOUR_OPERATOR',
  'default',
  NOW(),
  NOW()
);

-- Create Account entries for authentication
-- Password: demo123 (bcrypt hash)
INSERT INTO "Account" (
  id,
  "userId",
  type,
  provider,
  "providerAccountId",
  refresh_token,
  access_token,
  expires_at,
  token_type,
  scope,
  id_token,
  session_state
)
VALUES 
(
  gen_random_uuid(),
  'demo-traveler-001',
  'credentials',
  'credentials',
  'demo@example.com',
  '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22', -- bcrypt hash of 'demo123'
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
),
(
  gen_random_uuid(),
  'demo-operator-001',
  'credentials',
  'credentials',
  'demo-operator@example.com',
  '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22', -- bcrypt hash of 'demo123'
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
);

-- Create demo trips for the traveler
INSERT INTO "Trip" (id, title, description, "startDate", "endDate", location, status, "createdAt", "updatedAt", "userId")
VALUES 
(
  'demo-trip-italy',
  'Italian Adventure',
  'A wonderful journey through Rome, Florence, and Venice',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '40 days',
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
  NOW() + INTERVAL '60 days',
  NOW() + INTERVAL '74 days',
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
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '50 days',
  'Peru',
  'completed',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '50 days',
  'demo-traveler-001'
);

-- Create demo content for the tour operator
INSERT INTO "Content" (
  id,
  "tenantId",
  type,
  name,
  description,
  location,
  city,
  country,
  price,
  currency,
  duration,
  active,
  metadata,
  "createdAt",
  "updatedAt",
  "createdBy",
  featured
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

-- Create demo bookings/leads for the tour operator
INSERT INTO "Lead" (
  id,
  email,
  name,
  phone,
  destination,
  "startDate",
  "endDate",
  travelers,
  "budgetMin",
  "budgetMax",
  interests,
  "tripData",
  itinerary,
  score,
  status,
  "tenantId",
  "createdAt",
  "updatedAt"
)
VALUES 
(
  'demo-lead-1',
  'john.doe@example.com',
  'John Doe',
  '+1234567890',
  'Italy',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '40 days',
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
  NOW() + INTERVAL '60 days',
  NOW() + INTERVAL '74 days',
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