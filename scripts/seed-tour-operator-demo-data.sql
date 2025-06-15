-- Seed Tour Operator Demo Data for Supabase
-- This script creates demo content for the tour operator dashboard

-- First ensure the demo tour operator exists
DO $$
DECLARE
  demo_operator_id TEXT;
BEGIN
  -- Check if demo operator exists
  SELECT id INTO demo_operator_id FROM users WHERE email = 'demo-operator@example.com';
  
  -- If not found, we'll use a placeholder ID
  IF demo_operator_id IS NULL THEN
    demo_operator_id := 'demo-operator-001';
  END IF;

  -- Delete existing demo tours to avoid duplicates
  DELETE FROM content 
  WHERE "tenantId" = 'default' 
    AND type = 'activity'
    AND name IN (
      'Classic Italy Tour - Rome, Florence & Venice',
      'Japan Cultural Journey - Tokyo to Kyoto',
      'Peru Adventure - Machu Picchu & Sacred Valley',
      'Egypt Nile Cruise & Pyramids',
      'Iceland Ring Road Adventure'
    );

  -- Insert demo tours
  INSERT INTO content (
    id, "tenantId", type, name, description, location, city, country, 
    price, currency, duration, active, images, included, excluded, 
    metadata, featured, "createdAt", "updatedAt"
  ) VALUES
  -- Italy Tour
  (
    gen_random_uuid(),
    'default',
    'activity',
    'Classic Italy Tour - Rome, Florence & Venice',
    '10-day guided tour through Italy''s most iconic cities. Experience the Colosseum, Vatican City, Renaissance art in Florence, and romantic Venice canals.',
    'Italy',
    'Rome',
    'Italy',
    2499,
    'USD',
    10,
    true,
    '["https://images.unsplash.com/photo-1552832230-c0197dd311b5", "https://images.unsplash.com/photo-1534445867742-43195f401b6c", "https://images.unsplash.com/photo-1514896856000-91cb6de818e0"]',
    '["9 nights accommodation in 4-star hotels", "Daily breakfast", "Professional English-speaking guide", "All entrance fees to monuments", "High-speed train between cities", "Airport transfers"]',
    '["International flights", "Lunches and dinners", "Personal expenses", "Travel insurance", "Tips and gratuities"]',
    '{"maxParticipants": 20, "minParticipants": 8, "difficulty": "easy", "groupType": "mixed", "languages": ["English", "Spanish"], "departurePoint": "Rome Fiumicino Airport", "arrivalPoint": "Venice Marco Polo Airport", "bookingDeadline": 30, "cancellationPolicy": "Free cancellation up to 30 days before departure"}',
    true,
    NOW(),
    NOW()
  ),
  -- Japan Tour
  (
    gen_random_uuid(),
    'default',
    'activity',
    'Japan Cultural Journey - Tokyo to Kyoto',
    '14-day immersive experience exploring Japan''s ancient traditions and modern marvels. From bustling Tokyo to serene Kyoto temples.',
    'Japan',
    'Tokyo',
    'Japan',
    3799,
    'USD',
    14,
    true,
    '["https://images.unsplash.com/photo-1503899036084-c55cdd92da26", "https://images.unsplash.com/photo-1528360983277-13d401cdc186", "https://images.unsplash.com/photo-1545569341-9eb8b30979d9"]',
    '["13 nights accommodation (mix of hotels and ryokans)", "Daily breakfast and 4 traditional dinners", "JR Pass for unlimited train travel", "Expert bilingual guide", "All temple and shrine entrance fees", "Traditional tea ceremony experience", "Sumo wrestling tournament tickets (seasonal)"]',
    '["International flights", "Most lunches and dinners", "Personal expenses", "Travel insurance"]',
    '{"maxParticipants": 16, "minParticipants": 6, "difficulty": "moderate", "groupType": "small group", "languages": ["English"], "departurePoint": "Narita International Airport", "arrivalPoint": "Kansai International Airport", "bookingDeadline": 45, "cancellationPolicy": "Free cancellation up to 45 days before departure", "seasonalHighlights": {"spring": "Cherry blossoms", "autumn": "Fall foliage", "winter": "Snow monkeys"}}',
    true,
    NOW(),
    NOW()
  ),
  -- Peru Tour
  (
    gen_random_uuid(),
    'default',
    'activity',
    'Peru Adventure - Machu Picchu & Sacred Valley',
    '8-day adventure including the classic Inca Trail trek to Machu Picchu. Experience ancient ruins, local culture, and breathtaking landscapes.',
    'Peru',
    'Cusco',
    'Peru',
    1899,
    'USD',
    8,
    true,
    '["https://images.unsplash.com/photo-1526392060635-9d6019884377", "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca", "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4"]',
    '["7 nights accommodation (hotels and camping)", "All meals during trek", "Professional trekking guide and porters", "Inca Trail permits", "Machu Picchu entrance", "Train ticket from Aguas Calientes", "Sacred Valley tour"]',
    '["International flights", "Sleeping bag (rental available)", "Walking poles (rental available)", "Travel insurance", "Tips for guides and porters"]',
    '{"maxParticipants": 12, "minParticipants": 4, "difficulty": "challenging", "groupType": "adventure", "languages": ["English", "Spanish"], "departurePoint": "Cusco", "arrivalPoint": "Cusco", "bookingDeadline": 60, "cancellationPolicy": "Non-refundable after permits are secured", "fitnessLevel": "Good physical condition required", "altitude": "Max 4,200m - acclimatization recommended"}',
    false,
    NOW(),
    NOW()
  ),
  -- Egypt Tour
  (
    gen_random_uuid(),
    'default',
    'activity',
    'Egypt Nile Cruise & Pyramids',
    '12-day journey through ancient Egypt including 4-night Nile cruise, pyramids of Giza, Valley of the Kings, and Abu Simbel.',
    'Egypt',
    'Cairo',
    'Egypt',
    2299,
    'USD',
    12,
    true,
    '["https://images.unsplash.com/photo-1539650116574-8efeb43e2750", "https://images.unsplash.com/photo-1553913861-c0fddf2619ee", "https://images.unsplash.com/photo-1572252009286-268acec5ca0a"]',
    '["11 nights accommodation (hotels and cruise ship)", "Full board on cruise, breakfast in hotels", "Egyptologist guide throughout", "All entrance fees", "Domestic flight to Abu Simbel", "Airport and cruise transfers", "Felucca sailing experience"]',
    '["International flights", "Egypt visa", "Drinks and personal expenses", "Optional hot air balloon ride", "Tips"]',
    '{"maxParticipants": 24, "minParticipants": 10, "difficulty": "easy", "groupType": "cultural", "languages": ["English", "German", "French"], "departurePoint": "Cairo International Airport", "arrivalPoint": "Cairo International Airport", "bookingDeadline": 30, "cancellationPolicy": "Free cancellation up to 30 days before departure", "bestTimeToVisit": "October to April"}',
    false,
    NOW(),
    NOW()
  ),
  -- Iceland Tour (Draft)
  (
    gen_random_uuid(),
    'default',
    'activity',
    'Iceland Ring Road Adventure',
    '10-day self-drive tour around Iceland''s Ring Road. Witness waterfalls, glaciers, black sand beaches, and the chance to see Northern Lights.',
    'Iceland',
    'Reykjavik',
    'Iceland',
    2799,
    'USD',
    10,
    false, -- Draft status
    '["https://images.unsplash.com/photo-1504829857797-ddff29c27927", "https://images.unsplash.com/photo-1490650404312-a2175773bbf5", "https://images.unsplash.com/photo-1522071901873-411886a10004"]',
    '["9 nights accommodation in hotels/guesthouses", "Rental 4x4 vehicle with insurance", "Daily breakfast", "Detailed itinerary and maps", "Glacier hike with guide", "Blue Lagoon entrance", "24/7 local support"]',
    '["International flights", "Fuel for vehicle", "Lunches and dinners", "Optional activities", "Personal expenses"]',
    '{"maxParticipants": 4, "minParticipants": 2, "difficulty": "moderate", "groupType": "self-drive", "languages": ["English"], "departurePoint": "Keflavik International Airport", "arrivalPoint": "Keflavik International Airport", "bookingDeadline": 45, "cancellationPolicy": "Variable based on components", "drivingDistance": "1,332 km total", "vehicleType": "Toyota RAV4 or similar"}',
    false,
    NOW(),
    NOW()
  );

  -- Delete existing demo leads
  DELETE FROM leads 
  WHERE "tenantId" = 'default'
    AND email IN (
      'sarah.johnson@example.com',
      'michael.chen@example.com',
      'emma.wilson@example.com',
      'david.martinez@example.com',
      'lisa.anderson@example.com'
    );

  -- Insert demo leads
  INSERT INTO leads (
    id, email, name, phone, destination, "startDate", "endDate", 
    travelers, "budgetMin", "budgetMax", interests, "tripData", 
    score, status, "tenantId", "createdAt", "updatedAt"
  ) VALUES
  (
    gen_random_uuid(),
    'sarah.johnson@example.com',
    'Sarah Johnson',
    '+1-555-0123',
    'Italy',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '40 days',
    2,
    4000,
    6000,
    '["history", "art", "food", "wine"]',
    '{"preferredAccommodation": "4-star hotels", "dietaryRestrictions": "Vegetarian", "specialRequests": "Interested in cooking class in Florence"}',
    85,
    'new',
    'default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'michael.chen@example.com',
    'Michael Chen',
    '+1-555-0456',
    'Japan',
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '74 days',
    4,
    12000,
    16000,
    '["culture", "temples", "technology", "cuisine"]',
    '{"preferredAccommodation": "Mix of hotels and ryokans", "groupComposition": "2 adults, 2 teenagers", "specialInterests": "Anime/manga culture, traditional crafts"}',
    92,
    'contacted',
    'default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'emma.wilson@example.com',
    'Emma Wilson',
    '+44-20-5555-0789',
    'Peru',
    NOW() + INTERVAL '90 days',
    NOW() + INTERVAL '98 days',
    6,
    10000,
    12000,
    '["adventure", "hiking", "culture", "photography"]',
    '{"fitnessLevel": "Very active group", "previousTrekking": "Yes - Nepal and Patagonia", "specialRequests": "Professional photography guide for one day"}',
    88,
    'qualified',
    'default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'david.martinez@example.com',
    'David Martinez',
    '+1-555-0321',
    'Egypt',
    NOW() + INTERVAL '120 days',
    NOW() + INTERVAL '132 days',
    2,
    4000,
    5500,
    '["history", "archaeology", "desert", "cruise"]',
    '{"preferredCabinType": "Balcony suite on Nile cruise", "mobilityIssues": "None", "specialInterests": "Hieroglyphics workshop"}',
    78,
    'proposal_sent',
    'default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'lisa.anderson@example.com',
    'Lisa Anderson',
    '+1-555-0654',
    'Iceland',
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '55 days',
    2,
    5000,
    7000,
    '["nature", "photography", "northern lights", "hot springs"]',
    '{"drivingExperience": "Comfortable with winter driving", "photographyLevel": "Advanced - bringing professional equipment", "accommodation": "Prefer unique stays - glass igloos if possible"}',
    95,
    'won',
    'default',
    NOW(),
    NOW()
  );

END $$;

-- Output confirmation
SELECT 
  'Tour operator demo data created successfully!' as message,
  (SELECT COUNT(*) FROM content WHERE type = 'activity' AND "tenantId" = 'default') as tour_count,
  (SELECT COUNT(*) FROM leads WHERE "tenantId" = 'default') as lead_count;