-- Fix existing services: update prices and platforms

-- Update prices from price_per_1000 for existing services
UPDATE public.services 
SET price = price_per_1000 
WHERE price IS NULL OR price = 0;

-- Update platforms based on service names for existing services
-- Instagram
UPDATE public.services 
SET platform = 'instagram' 
WHERE platform = 'other' 
  AND (LOWER(name) LIKE '%instagram%' OR LOWER(name) LIKE '%insta%' OR LOWER(name) LIKE '%ig %');

-- Facebook  
UPDATE public.services 
SET platform = 'facebook'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%facebook%' OR LOWER(name) LIKE '%fb %' OR LOWER(name) LIKE '%فيسبوك%');

-- TikTok
UPDATE public.services 
SET platform = 'tiktok'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%tiktok%' OR LOWER(name) LIKE '%tik tok%');

-- YouTube
UPDATE public.services 
SET platform = 'youtube'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%youtube%' OR LOWER(name) LIKE '%yt %' OR LOWER(name) LIKE '%يوتيوب%');

-- Twitter/X
UPDATE public.services 
SET platform = 'twitter'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%twitter%' OR LOWER(name) LIKE '%تويتر%');

-- Snapchat
UPDATE public.services 
SET platform = 'snapchat'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%snapchat%' OR LOWER(name) LIKE '%snap%');

-- Telegram
UPDATE public.services 
SET platform = 'telegram'
WHERE platform = 'other'
  AND (LOWER(name) LIKE '%telegram%' OR LOWER(name) LIKE '%تليجرام%');
