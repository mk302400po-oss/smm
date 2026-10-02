-- Fix services platform categorization - CORRECT ORDER
-- Execute specific platforms FIRST, Instagram LAST

-- Snapchat FIRST
UPDATE services SET platform = 'Snapchat'
WHERE platform = 'Other' AND (
    name ILIKE '%snapchat%' OR name ILIKE '%snap %' OR name ILIKE '%سناب%' OR name ILIKE '%سناب شات%'
    OR name ILIKE '%كواي%' OR name ILIKE '%خواي%' OR name ILIKE '%صوير%'
);

-- Telegram
UPDATE services SET platform = 'Telegram'
WHERE platform = 'Other' AND (
    name ILIKE '%telegram%' OR name ILIKE '%تيليجرام%' OR name ILIKE '%تليجرام%' OR name ILIKE '%تلغرام%'
    OR name ILIKE '%تيلجرام%' OR name ILIKE '%قناة تيليجرام%' OR name ILIKE '%مجموعة تيليجرام%'
    OR name ILIKE '%ستوري تيليجرام%' OR name ILIKE '%تعليقات تيليجرام%'
);

-- WhatsApp
UPDATE services SET platform = 'WhatsApp'
WHERE platform = 'Other' AND (
    name ILIKE '%whatsapp%' OR name ILIKE '%whats app%' OR name ILIKE '%واتساب%'
    OR name ILIKE '%وتساب%' OR name ILIKE '%واتس اب%' OR name ILIKE '%قناة وتساب%' OR name ILIKE '%قناة واتساب%'
);

-- TikTok
UPDATE services SET platform = 'TikTok'
WHERE platform = 'Other' AND (
    name ILIKE '%tiktok%' OR name ILIKE '%tik tok%' OR name ILIKE '%تيك توك%' OR name ILIKE '%تيكتوك%'
);

-- Facebook
UPDATE services SET platform = 'Facebook'
WHERE platform = 'Other' AND (
    name ILIKE '%facebook%' OR name ILIKE '%fb %' OR name ILIKE '%فيسبوك%' OR name ILIKE '%فيس بوك%'
    OR name ILIKE '%FB%' OR name ILIKE '%صفحة فيس%' OR name ILIKE '%بيج %' OR name ILIKE '%page %'
);

-- YouTube  
UPDATE services SET platform = 'YouTube'
WHERE platform = 'Other' AND (
    name ILIKE '%youtube%' OR name ILIKE '%yt %' OR name ILIKE '%يوتيوب%' OR name ILIKE '%يوتوب%'
);

-- Twitter
UPDATE services SET platform = 'Twitter'
WHERE platform = 'Other' AND (
    name ILIKE '%twitter%' OR name ILIKE '%tweet%' OR name ILIKE '%x.com%' OR name ILIKE '%تويتر%' OR name ILIKE '% X %'
);

-- Twitch
UPDATE services SET platform = 'Twitch'
WHERE platform = 'Other' AND (name ILIKE '%twitch%' OR name ILIKE '%تويتش%');

-- LinkedIn
UPDATE services SET platform = 'LinkedIn'
WHERE platform = 'Other' AND (name ILIKE '%linkedin%' OR name ILIKE '%لينكد%' OR name ILIKE '%لينكدان%');

-- Threads
UPDATE services SET platform = 'Threads'
WHERE platform = 'Other' AND (name ILIKE '%threads%' OR name ILIKE '%ثريدز%');

-- Instagram LAST
UPDATE services SET platform = 'Instagram'
WHERE platform = 'Other' AND (
    name ILIKE '%instagram%' OR name ILIKE '%insta%' OR name ILIKE '%ig %' OR name ILIKE '%انستقرام%'
    OR name ILIKE '%انستغرام%' OR name ILIKE '%انستجرام%' OR name ILIKE '%IG%' OR name ILIKE '%ايجي%'
    OR name ILIKE '%ستوري انستجرام%' OR name ILIKE '%ريلز%' OR name ILIKE '%reels%'
);
