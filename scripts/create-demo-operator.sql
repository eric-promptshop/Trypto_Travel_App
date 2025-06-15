-- Create demo tour operator user
-- First check if user exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo-operator@example.com') THEN
    INSERT INTO users (id, email, name, role, "tenantId", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      'demo-operator@example.com',
      'Demo Tour Operator',
      'TOUR_OPERATOR',
      'default',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Demo tour operator user created';
  ELSE
    RAISE NOTICE 'Demo tour operator already exists';
  END IF;
END $$;

-- Verify the user was created
SELECT id, email, name, role, "tenantId" 
FROM users 
WHERE email = 'demo-operator@example.com';

-- Check if demo content exists
SELECT 
  'Tour operator demo status:' as info,
  (SELECT COUNT(*) FROM users WHERE email = 'demo-operator@example.com') as operator_exists,
  (SELECT COUNT(*) FROM content WHERE type = 'activity' AND "tenantId" = 'default') as tour_count,
  (SELECT COUNT(*) FROM leads WHERE "tenantId" = 'default') as lead_count;