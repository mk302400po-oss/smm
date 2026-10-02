-- Fix incorrect platform assignments - COMPREHENSIVE FIX
-- This migration moves services even if they're already assigned to wrong platforms

-- Move Snapchat services from anywhere (including Instagram) to Snapchat
UPDATE services 
SET platform = 'Snapchat'
WHERE (
    name ILIKE '%كواي%' 
    OR name ILIKE '%خواي%'
    OR name ILIKE '%سناب شات%'
    OR name ILIKE '%سناب%'
    OR name ILIKE '%snapchat%'
    OR name ILIKE '%snap %'
    OR name ILIKE '%صوير%'
)
-- Exclude services that explicitly mention Instagram
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%انستغرام%'
AND name NOT ILIKE '%انستجرام%'
AND name NOT ILIKE '%instagram%';

-- Move Telegram services to Telegram
UPDATE services 
SET platform = 'Telegram'  
WHERE (
    name ILIKE '%تيليجرام%'
    OR name ILIKE '%تليجرام%'
    OR name ILIKE '%تلغرام%'
    OR name ILIKE '%telegram%'
    OR name ILIKE '%قناة تيليجرام%'
    OR name ILIKE '%مجموعة تيليجرام%'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%انستغرام%'
AND name NOT ILIKE '%instagram%';

-- Move WhatsApp services to WhatsApp
UPDATE services 
SET platform = 'WhatsApp'
WHERE (
    name ILIKE '%واتساب%'
    OR name ILIKE '%وتساب%'
    OR name ILIKE '%واتس اب%'
    OR name ILIKE '%whatsapp%'
    OR name ILIKE '%قناة وتساب%'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%instagram%';

-- Move TikTok services to TikTok  
UPDATE services 
SET platform = 'TikTok'
WHERE (
    name ILIKE '%تيك توك%'
    OR name ILIKE '%تيكتوك%'
    OR name ILIKE '%tiktok%'
    OR name ILIKE '%tik tok%'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%instagram%';

-- Move Facebook services to Facebook
UPDATE services 
SET platform = 'Facebook'
WHERE (
    name ILIKE '%فيسبوك%'
    OR name ILIKE '%فيس بوك%'
    OR name ILIKE '%facebook%'
    OR name ILIKE '%fb %'
    OR name ILIKE '%صفحة فيس%'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%instagram%';

-- Move YouTube services to YouTube
UPDATE services 
SET platform = 'YouTube'
WHERE (
    name ILIKE '%يوتيوب%'
    OR name ILIKE '%يوتوب%'
    OR name ILIKE '%youtube%'
    OR name ILIKE '%yt %'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%instagram%';

-- Move Twitter services to Twitter
UPDATE services 
SET platform = 'Twitter'
WHERE (
    name ILIKE '%تويتر%'
    OR name ILIKE '%twitter%'
    OR name ILIKE '%tweet%'
)
AND name NOT ILIKE '%انستقرام%'
AND name NOT ILIKE '%instagram%';
