-- Check exact column names in content table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'content'
ORDER BY ordinal_position;

-- Check if tenantId column exists with quotes
SELECT 
  COUNT(*) as records_with_quoted_tenantId
FROM content 
WHERE "tenantId" = 'default';

-- Check if tenantId column exists without quotes  
SELECT 
  COUNT(*) as records_with_unquoted_tenantid
FROM content 
WHERE tenantid = 'default';