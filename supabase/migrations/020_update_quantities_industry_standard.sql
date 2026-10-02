-- Update min and max quantities to match industry standards
-- Based on typical SMM panel configurations

-- For Followers services
UPDATE services
SET 
    min_quantity = 100,
    max_quantity = CASE 
        WHEN max_quantity < 100000 THEN 100000
        ELSE max_quantity
    END
WHERE (
    category LIKE '%متابع%' OR 
    category LIKE '%follower%' OR
    LOWER(name) LIKE '%متابع%' OR
    LOWER(name) LIKE '%follower%'
);

-- For Likes services  
UPDATE services
SET 
    min_quantity = 10,
    max_quantity = CASE 
        WHEN max_quantity < 100000 THEN 100000
        ELSE max_quantity
    END
WHERE (
    category LIKE '%لايك%' OR 
    category LIKE '%like%' OR
    category LIKE '%اعجاب%' OR
    LOWER(name) LIKE '%لايك%' OR
    LOWER(name) LIKE '%like%' OR
    LOWER(name) LIKE '%اعجاب%'
);

-- For Views services
UPDATE services
SET 
    min_quantity = 100,
    max_quantity = CASE 
        WHEN max_quantity < 1000000 THEN 1000000
        ELSE max_quantity
    END
WHERE (
    category LIKE '%مشاهد%' OR 
    category LIKE '%view%' OR
    LOWER(name) LIKE '%مشاهد%' OR
    LOWER(name) LIKE '%view%'
);

-- For Comments services
UPDATE services
SET 
    min_quantity = 5,
    max_quantity = CASE 
        WHEN max_quantity < 10000 THEN 10000
        ELSE max_quantity
    END
WHERE (
    category LIKE '%تعليق%' OR 
    category LIKE '%comment%' OR
    LOWER(name) LIKE '%تعليق%' OR
    LOWER(name) LIKE '%comment%'
);

-- For Subscribers services
UPDATE services
SET 
    min_quantity = 50,
    max_quantity = CASE 
        WHEN max_quantity < 100000 THEN 100000
        ELSE max_quantity
    END
WHERE (
    category LIKE '%مشترك%' OR 
    category LIKE '%subscribe%' OR
    LOWER(name) LIKE '%مشترك%' OR
    LOWER(name) LIKE '%subscribe%'
);

-- Show results by category
SELECT 
    CASE 
        WHEN category LIKE '%متابع%' OR LOWER(name) LIKE '%follower%' THEN 'Followers'
        WHEN category LIKE '%لايك%' OR LOWER(name) LIKE '%like%' THEN 'Likes'
        WHEN category LIKE '%مشاهد%' OR LOWER(name) LIKE '%view%' THEN 'Views'
        WHEN category LIKE '%تعليق%' OR LOWER(name) LIKE '%comment%' THEN 'Comments'
        WHEN category LIKE '%مشترك%' OR LOWER(name) LIKE '%subscribe%' THEN 'Subscribers'
        ELSE 'Other'
    END as service_type,
    MIN(min_quantity) as min_qty,
    MAX(max_quantity) as max_qty,
    COUNT(*) as count
FROM services
GROUP BY service_type
ORDER BY count DESC;
