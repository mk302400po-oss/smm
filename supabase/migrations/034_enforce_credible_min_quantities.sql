-- Migration محسّن: رفع الحد الأدنى للخدمات الرئيسية فقط
-- متابعين، لايكات، مشاهدات → 1000
-- باقي الخدمات → تبقى كما من API

-- متابعين (Followers) - رفع لـ 1000
UPDATE services
SET min_quantity = GREATEST(min_quantity, 1000)
WHERE (
    LOWER(category) LIKE '%متابع%' OR 
    LOWER(category) LIKE '%follower%' OR
    LOWER(name) LIKE '%متابع%' OR
    LOWER(name) LIKE '%follower%'
) 
AND price_per_1000 IS NOT NULL
AND min_quantity < 1000;

-- لايكات (Likes) - رفع لـ 1000
UPDATE services
SET min_quantity = GREATEST(min_quantity, 1000)
WHERE (
    LOWER(category) LIKE '%لايك%' OR 
    LOWER(category) LIKE '%like%' OR
    LOWER(category) LIKE '%اعجاب%' OR
    LOWER(name) LIKE '%لايك%' OR
    LOWER(name) LIKE '%like%' OR
    LOWER(name) LIKE '%اعجاب%'
)
AND price_per_1000 IS NOT NULL
AND min_quantity < 1000;

-- مشاهدات (Views) - رفع لـ 1000
UPDATE services
SET min_quantity = GREATEST(min_quantity, 1000)
WHERE (
    LOWER(category) LIKE '%مشاهد%' OR 
    LOWER(category) LIKE '%view%' OR
    LOWER(name) LIKE '%مشاهد%' OR
    LOWER(name) LIKE '%view%'
)
AND price_per_1000 IS NOT NULL
AND min_quantity < 1000;

-- مشتركين يوتيوب (Subscribers) - رفع لـ 100
UPDATE services
SET min_quantity = GREATEST(min_quantity, 100)
WHERE (
    LOWER(category) LIKE '%مشترك%' OR 
    LOWER(category) LIKE '%subscriber%' OR
    LOWER(name) LIKE '%مشترك%' OR
    LOWER(name) LIKE '%subscriber%'
)
AND price_per_1000 IS NOT NULL
AND min_quantity < 100;

-- باقي الخدمات تبقى كما هي من API ✅
-- (تعليقات، ريأكت، اعضاء جروب، الخ...)

-- عرض ملخص النتائج
SELECT 
    CASE 
        WHEN LOWER(category) LIKE '%متابع%' OR LOWER(name) LIKE '%follower%' THEN '📱 متابعين'
        WHEN LOWER(category) LIKE '%لايك%' OR LOWER(name) LIKE '%like%' THEN '❤️ لايكات'
        WHEN LOWER(category) LIKE '%مشاهد%' OR LOWER(name) LIKE '%view%' THEN '👁️ مشاهدات'
        WHEN LOWER(category) LIKE '%مشترك%' OR LOWER(name) LIKE '%subscriber%' THEN '🔔 مشتركين'
        WHEN LOWER(category) LIKE '%تعليق%' OR LOWER(name) LIKE '%comment%' THEN '💬 تعليقات'
        WHEN LOWER(category) LIKE '%ريأكت%' OR LOWER(name) LIKE '%react%' THEN '😊 ريأكت'
        WHEN LOWER(category) LIKE '%جروب%' OR LOWER(category) LIKE '%group%' THEN '👥 اعضاء جروب'
        WHEN LOWER(category) LIKE '%مشارك%' OR LOWER(name) LIKE '%share%' THEN '↗️ مشاركات'
        ELSE '🌐 أخرى'
    END as نوع_الخدمة,
    COUNT(*) as عدد_الخدمات,
    MIN(min_quantity) as الحد_الأدنى,
    MAX(max_quantity) as الحد_الأقصى
FROM services
WHERE price_per_1000 IS NOT NULL
GROUP BY نوع_الخدمة
ORDER BY عدد_الخدمات DESC;
