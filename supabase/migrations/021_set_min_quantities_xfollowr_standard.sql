-- Update min quantities based on xfollowr.com standards
-- Views, Likes, Followers, Comments: min = 1000
-- Everything else: min = 1

-- Update Followers (متابعين)
UPDATE services
SET min_quantity = 1000
WHERE (
    category LIKE '%متابع%' OR 
    category LIKE '%follower%' OR
    LOWER(name) LIKE '%متابع%' OR
    LOWER(name) LIKE '%follower%'
) AND (min_quantity != 1000 OR min_quantity IS NULL);

-- Update Likes (لايكات)
UPDATE services
SET min_quantity = 1000
WHERE (
    category LIKE '%لايك%' OR 
    category LIKE '%like%' OR
    category LIKE '%اعجاب%' OR
    LOWER(name) LIKE '%لايك%' OR
    LOWER(name) LIKE '%like%' OR
    LOWER(name) LIKE '%اعجاب%'
) AND (min_quantity != 1000 OR min_quantity IS NULL);

-- Update Views (مشاهدات)
UPDATE services
SET min_quantity = 1000
WHERE (
    category LIKE '%مشاهد%' OR 
    category LIKE '%view%' OR
    LOWER(name) LIKE '%مشاهد%' OR
    LOWER(name) LIKE '%view%'
) AND (min_quantity != 1000 OR min_quantity IS NULL);

-- Update Comments (تعليقات)
UPDATE services
SET min_quantity = 1000
WHERE (
    category LIKE '%تعليق%' OR 
    category LIKE '%comment%' OR
    LOWER(name) LIKE '%تعليق%' OR
    LOWER(name) LIKE '%comment%'
) AND (min_quantity != 1000 OR min_quantity IS NULL);

-- Update everything else to min = 1
UPDATE services
SET min_quantity = 1
WHERE NOT (
    category LIKE '%متابع%' OR category LIKE '%follower%' OR
    category LIKE '%لايك%' OR category LIKE '%like%' OR category LIKE '%اعجاب%' OR
    category LIKE '%مشاهد%' OR category LIKE '%view%' OR
    category LIKE '%تعليق%' OR category LIKE '%comment%' OR
    LOWER(name) LIKE '%متابع%' OR LOWER(name) LIKE '%follower%' OR
    LOWER(name) LIKE '%لايك%' OR LOWER(name) LIKE '%like%' OR LOWER(name) LIKE '%اعجاب%' OR
    LOWER(name) LIKE '%مشاهد%' OR LOWER(name) LIKE '%view%' OR
    LOWER(name) LIKE '%تعليق%' OR LOWER(name) LIKE '%comment%'
) AND (min_quantity != 1 OR min_quantity IS NULL);

-- Show summary
SELECT 
    CASE 
        WHEN category LIKE '%متابع%' OR LOWER(name) LIKE '%follower%' THEN 'Followers (1000)'
        WHEN category LIKE '%لايك%' OR LOWER(name) LIKE '%like%' THEN 'Likes (1000)'
        WHEN category LIKE '%مشاهد%' OR LOWER(name) LIKE '%view%' THEN 'Views (1000)'
        WHEN category LIKE '%تعليق%' OR LOWER(name) LIKE '%comment%' THEN 'Comments (1000)'
        ELSE 'Other Services (1)'
    END as service_type,
    COUNT(*) as total_services,
    MIN(min_quantity) as min_qty,
    MAX(max_quantity) as max_qty
FROM services
GROUP BY service_type
ORDER BY total_services DESC;
