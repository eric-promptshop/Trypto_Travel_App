-- Verify demo data was inserted correctly

-- Check content table
SELECT 
  'Content table data:' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN type = 'activity' THEN 1 END) as activity_count,
  COUNT(CASE WHEN "tenantId" = 'default' THEN 1 END) as default_tenant_count
FROM content;

-- Show sample tours
SELECT 
  id,
  name,
  type,
  "tenantId",
  active,
  price,
  currency
FROM content 
WHERE type = 'activity' 
  AND "tenantId" = 'default'
LIMIT 5;

-- Check leads table
SELECT 
  'Leads table data:' as info,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN "tenantId" = 'default' THEN 1 END) as default_tenant_leads
FROM leads;

-- Check if demo tour operator exists
SELECT 
  id,
  email,
  name,
  role,
  "tenantId"
FROM users 
WHERE email = 'demo-operator@example.com';