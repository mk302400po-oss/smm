-- RESET AND REBUILD - Clean platform categorization from scratch
-- Step 1: Reset all services to 'Other' (clean slate)
-- Step 2: Recategorize everything in correct order

-- ============================================
-- STEP 1: RESET ALL TO 'Other'
-- ============================================
UPDATE services 
SET platform = 'Other'
WHERE platform IN ('Instagram', 'Facebook', 'TikTok', 'YouTube', 'Twitter', 'Telegram', 'Snapchat', 'WhatsApp', 'Twitch', 'LinkedIn', 'Threads');

-- ============================================
-- STEP 2: RECATEGORIZE IN CORRECT ORDER
-- ============================================

-- 1. Snapchat (FIRST - to catch كواي services)
UPDATE services 
SET platform = 'Snapchat'
WHERE platform = 'Other' 
AND (
    name ILIKE '%كواي%' 
    OR name ILIKE '%خواي%'
    OR name ILIKE '%سناب شات%'
    OR name ILIKE '%سناب%'
    OR name ILIKE '%snapchat%'
    OR name ILIKE '%snap %'
    OR name ILIKE '%صوير%'
);

-- 2. Telegram
UPDATE services 
SET platform = 'Telegram'
WHERE platform = 'Other' 
AND (
    name ILIKE '%تيليجرام%'
    OR name ILIKE '%تليجرام%'
    OR name ILIKE '%تلغرام%'
    OR name ILIKE '%تيلجرام%'
    OR name ILIKE '%telegram%'
    OR name ILIKE '%قناة تيليجرام%'
    OR name ILIKE '%مجموعة تيليجرام%'
    OR name ILIKE '%ستوري تيليجرام%'
    OR name ILIKE '%تعليقات تيليجرام%'
    OR name ILIKE '%أعضاء تيليجرام%'
    OR name ILIKE '%اعضاء تيليجرام%'
);

-- 3. WhatsApp
UPDATE services 
SET platform = 'WhatsApp'
WHERE platform = 'Other' 
AND (
    name ILIKE '%واتساب%'
    OR name ILIKE '%وتساب%'
    OR name ILIKE '%واتس اب%'
    OR name ILIKE '%whatsapp%'
    OR name ILIKE '%whats app%'
    OR name ILIKE '%قناة وتساب%'
    OR name ILIKE '%قناة واتساب%'
);

-- 4. TikTok  
UPDATE services 
SET platform = 'TikTok'
WHERE platform = 'Other' 
AND (
    name ILIKE '%تيك توك%'
    OR name ILIKE '%تيكتوك%'
    OR name ILIKE '%tiktok%'
    OR name ILIKE '%tik tok%'
);

-- 5. YouTube
UPDATE services 
SET platform = 'YouTube'
WHERE platform = 'Other' 
AND (
    name ILIKE '%يوتيوب%'
    OR name ILIKE '%يوتوب%'
    OR name ILIKE '%youtube%'
    OR name ILIKE '%yt %'
);

-- 6. Facebook
UPDATE services 
SET platform = 'Facebook'
WHERE platform = 'Other' 
AND (
    name ILIKE '%فيسبوك%'
    OR name ILIKE '%فيس بوك%'
    OR name ILIKE '%facebook%'
    OR name ILIKE '%fb %'
    OR name ILIKE '%FB%'
    OR name ILIKE '%صفحة فيس%'
    OR name ILIKE '%بيج %'
    OR name ILIKE '%page %'
);

-- 7. Twitter / X
UPDATE services 
SET platform = 'Twitter'
WHERE platform = 'Other' 
AND (
    name ILIKE '%تويتر%'
    OR name ILIKE '%twitter%'
    OR name ILIKE '%tweet%'
    OR name ILIKE '%x.com%'
    OR name ILIKE '% X %'
);

-- 8. Twitch
UPDATE services 
SET platform = 'Twitch'
WHERE platform = 'Other' 
AND (
    name ILIKE '%twitch%'
    OR name ILIKE '%تويتش%'
);

-- 9. LinkedIn
UPDATE services 
SET platform = 'LinkedIn'
WHERE platform = 'Other' 
AND (
    name ILIKE '%linkedin%'
    OR name ILIKE '%لينكد%'
    OR name ILIKE '%لينكدان%'
);

-- 10. Threads
UPDATE services 
SET platform = 'Threads'
WHERE platform = 'Other' 
AND (
    name ILIKE '%threads%'
    OR name ILIKE '%ثريدز%'
);

-- 11. Instagram (LAST - to avoid conflicts)
UPDATE services 
SET platform = 'Instagram'
WHERE platform = 'Other' 
AND (
    name ILIKE '%انستقرام%'
    OR name ILIKE '%انستغرام%'
    OR name ILIKE '%انستجرام%'
    OR name ILIKE '%instagram%'
    OR name ILIKE '%insta%'
    OR name ILIKE '%ig %'
    OR name ILIKE '%IG%'
    OR name ILIKE '%ايجي%'
    OR name ILIKE '%ستوري انستجرام%'
    OR name ILIKE '%ريلز%'
    OR name ILIKE '%reels%'
);

-- ============================================
-- VERIFICATION: Show count by platform
-- ============================================
-- Uncomment to see results:
-- SELECT platform, COUNT(*) as service_count 
-- FROM services 
-- GROUP BY platform 
-- ORDER BY platform;
