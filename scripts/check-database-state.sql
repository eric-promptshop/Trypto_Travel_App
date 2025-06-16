-- Check current database state and missing tables

-- 1. List all tables in the database
SELECT 'Current Tables in Database' as report_section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if specific required tables exist
SELECT 'Required Tables Check' as report_section;
SELECT 
  'users' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as exists,
  UNION ALL
SELECT 'accounts', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts')
  UNION ALL
SELECT 'sessions', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions')
  UNION ALL
SELECT 'tenants', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants')
  UNION ALL
SELECT 'trips', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trips')
  UNION ALL
SELECT 'leads', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'leads')
  UNION ALL
SELECT 'content', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'content')
  UNION ALL
SELECT 'tenant_content', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_content')
  UNION ALL
SELECT 'itineraries', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'itineraries')
  UNION ALL
SELECT 'audit_logs', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');

-- 3. Check Prisma migrations table
SELECT 'Prisma Migrations Status' as report_section;
SELECT * FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;

-- 4. Check column structure for users table
SELECT 'Users Table Columns' as report_section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check indexes
SELECT 'Database Indexes' as report_section;
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'trips', 'leads', 'content', 'itineraries', 'audit_logs')
ORDER BY tablename, indexname;