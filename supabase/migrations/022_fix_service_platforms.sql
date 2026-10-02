-- Fix services with incorrect platform assignments
-- Move services from 'Other' to their correct platforms based on service name
-- Comprehensive version with all possible variations

-- Instagram
UPDATE services
SET platform = 'Instagram'
WHERE platform = 'Other' 
AND (
    name ILIKE '%instagram%' 
    OR name ILIKE '%insta%'
    OR name ILIKE '%ig %'
    OR name ILIKE '%انستقرام%'
    OR name ILIKE '%انستغرام%'
    OR name ILIKE '%انستجرام%'
    OR name ILIKE '%IG%'
    OR name ILIKE '%ايجي%'
    OR name ILIKE '%مشاهدة فديو انستجرام%'
    OR name ILIKE '%بث مباشر انستجرام%'
    OR name ILIKE '%ستوري انستجرام%'
    OR name ILIKE '%ريلز%'
    OR name ILIKE '%reels%'
)
-- Exclude services that belong to other platforms
AND name NOT ILIKE '%كواي%'
AND name NOT ILIKE '%سناب%'
AND name NOT ILIKE '%تيليجرام%'
AND name NOT ILIKE '%تليجرام%'
AND name NOT ILIKE '%وتساب%'
AND name NOT ILIKE '%واتساب%'
AND name NOT ILIKE '%فيسبوك%'
AND name NOT ILIKE '%تيك توك%'
AND name NOT ILIKE '%يوتيوب%'
AND name NOT ILIKE '%تويتر%';

-- Facebook
UPDATE services
SET platform = 'Facebook'
WHERE platform = 'Other' 
AND (
    name ILIKE '%facebook%' 
    OR name ILIKE '%fb %'
    OR name ILIKE '%فيسبوك%'
    OR name ILIKE '%فيس بوك%'
    OR name ILIKE '%FB%'
    OR name ILIKE '%صفحة فيس%'
    OR name ILIKE '%بيج %'
    OR name ILIKE '%page %'
);

-- TikTok
UPDATE services
SET platform = 'TikTok'
WHERE platform = 'Other' 
AND (
    name ILIKE '%tiktok%' 
    OR name ILIKE '%tik tok%'
    OR name ILIKE '%تيك توك%'
    OR name ILIKE '%تيكتوك%'
);

-- YouTube
UPDATE services
SET platform = 'YouTube'
WHERE platform = 'Other' 
AND (
    name ILIKE '%youtube%' 
    OR name ILIKE '%yt %'
    OR name ILIKE '%يوتيوب%'
    OR name ILIKE '%يوتوب%'
);

-- Twitter / X
UPDATE services
SET platform = 'Twitter'
WHERE platform = 'Other' 
AND (
    name ILIKE '%twitter%' 
    OR name ILIKE '%tweet%'
    OR name ILIKE '%x.com%'
    OR name ILIKE '%تويتر%'
    OR name ILIKE '% X %'
);

-- Telegram - Most comprehensive
UPDATE services
SET platform = 'Telegram'
WHERE platform = 'Other' 
AND (
    name ILIKE '%telegram%'
    OR name ILIKE '%تيليجرام%'
    OR name ILIKE '%تليجرام%'
    OR name ILIKE '%تلغرام%'
    OR name ILIKE '%تيلجرام%'
    OR name ILIKE '%تفاعل تيليجرام%'
    OR name ILIKE '%مشاهدات تيليجرام%'
    OR name ILIKE '%أعضاء تيليجرام%'
    OR name ILIKE '%اعضاء تيليجرام%'
    OR name ILIKE '%توثيق تيليجرام%'
    OR name ILIKE '%منشور تيليجرام%'
    OR name ILIKE '%قناة تيليجرام%'
    OR name ILIKE '%مجموعة تيليجرام%'
    OR name ILIKE '%ستوري تيليجرام%'
    OR name ILIKE '%تعليقات تيليجرام%'
);

-- Snapchat
UPDATE services
SET platform = 'Snapchat'
WHERE platform = 'Other' 
AND (
    name ILIKE '%snapchat%' 
    OR name ILIKE '%snap %'
    OR name ILIKE '%سناب%'
    OR name ILIKE '%سناب شات%'
    OR name ILIKE '%صوير%'
);

-- WhatsApp
UPDATE services
SET platform = 'WhatsApp'
WHERE platform = 'Other' 
AND (
    name ILIKE '%whatsapp%'
    OR name ILIKE '%whats app%'
    OR name ILIKE '%واتساب%'
    OR name ILIKE '%وتساب%'
    OR name ILIKE '%واتس اب%'
    OR name ILIKE '%قناة وتساب%'
    OR name ILIKE '%قناة واتساب%'
);

-- Twitch
UPDATE services
SET platform = 'Twitch'
WHERE platform = 'Other' 
AND (
    name ILIKE '%twitch%'
    OR name ILIKE '%تويتش%'
);

-- LinkedIn
UPDATE services
SET platform = 'LinkedIn'
WHERE platform = 'Other' 
AND (
    name ILIKE '%linkedin%'
    OR name ILIKE '%لينكد%'
    OR name ILIKE '%لينكدان%'
);

-- Threads
UPDATE services
SET platform = 'Threads'
WHERE platform = 'Other' 
AND (
    name ILIKE '%threads%'
    OR name ILIKE '%ثريدز%'
);
