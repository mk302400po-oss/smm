-- Update minimum quantity to 1000 for followers and likes services
-- This ensures proper pricing calculation

UPDATE services
SET min_quantity = 1000
WHERE (
    category LIKE '%متابع%' OR 
    category LIKE '%follower%' OR
    category LIKE '%لايك%' OR 
    category LIKE '%like%' OR
    LOWER(name) LIKE '%متابع%' OR
    LOWER(name) LIKE '%follower%' OR
    LOWER(name) LIKE '%لايك%' OR
    LOWER(name) LIKE '%like%'
) AND (min_quantity < 1000 OR min_quantity IS NULL);

-- Show affected services
SELECT 
    platform,
    category,
    COUNT(*) as updated_count
FROM services
WHERE min_quantity = 1000
GROUP BY platform, category
ORDER BY platform, category;
