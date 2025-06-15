-- Check the actual structure of the trips table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'trips'
ORDER BY 
    ordinal_position;

-- Also check if there are any existing trips to see the data pattern
SELECT * FROM "trips" LIMIT 1;