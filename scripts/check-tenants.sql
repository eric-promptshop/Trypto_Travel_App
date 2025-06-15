-- Check existing tenants in the database
SELECT id, name, slug, domain, "isActive" FROM "tenants";

-- Check if there are any existing users and their tenant associations
SELECT DISTINCT "tenantId", COUNT(*) as user_count 
FROM "users" 
GROUP BY "tenantId"
ORDER BY user_count DESC;