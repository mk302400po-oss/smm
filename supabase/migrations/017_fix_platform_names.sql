-- Fix platform names by extracting from service names
-- This will automatically detect the platform from the service name

UPDATE services
SET platform = CASE
    -- Instagram
    WHEN LOWER(name) LIKE '%instagram%' OR LOWER(name) LIKE '%انستقرام%' OR LOWER(name) LIKE '%انستا%' THEN 'Instagram'
    
    -- Facebook
    WHEN LOWER(name) LIKE '%facebook%' OR LOWER(name) LIKE '%فيسبوك%' OR LOWER(name) LIKE '%فيس بوك%' THEN 'Facebook'
    
    -- TikTok
    WHEN LOWER(name) LIKE '%tiktok%' OR LOWER(name) LIKE '%tik tok%' OR LOWER(name) LIKE '%تيك توك%' THEN 'TikTok'
    
    -- YouTube
    WHEN LOWER(name) LIKE '%youtube%' OR LOWER(name) LIKE '%يوتيوب%' THEN 'YouTube'
    
    -- Twitter / X
    WHEN LOWER(name) LIKE '%twitter%' OR LOWER(name) LIKE '%تويتر%' OR LOWER(name) LIKE '% x %' THEN 'Twitter'
    
    -- Snapchat
    WHEN LOWER(name) LIKE '%snapchat%' OR LOWER(name) LIKE '%سناب%' OR LOWER(name) LIKE '%snap%' THEN 'Snapchat'
    
    -- Telegram
    WHEN LOWER(name) LIKE '%telegram%' OR LOWER(name) LIKE '%تيليجرام%' OR LOWER(name) LIKE '%تلغرام%' THEN 'Telegram'
    
    -- WhatsApp
    WHEN LOWER(name) LIKE '%whatsapp%' OR LOWER(name) LIKE '%واتساب%' OR LOWER(name) LIKE '%whats%' THEN 'WhatsApp'
    
    -- LinkedIn
    WHEN LOWER(name) LIKE '%linkedin%' OR LOWER(name) LIKE '%لينكد%' THEN 'LinkedIn'
    
    -- Pinterest
    WHEN LOWER(name) LIKE '%pinterest%' OR LOWER(name) LIKE '%بينترست%' THEN 'Pinterest'
    
    -- Reddit
    WHEN LOWER(name) LIKE '%reddit%' OR LOWER(name) LIKE '%ريديت%' THEN 'Reddit'
    
    -- Twitch
    WHEN LOWER(name) LIKE '%twitch%' OR LOWER(name) LIKE '%تويتش%' THEN 'Twitch'
    
    -- Discord
    WHEN LOWER(name) LIKE '%discord%' OR LOWER(name) LIKE '%ديسكورد%' THEN 'Discord'
    
    -- Threads
    WHEN LOWER(name) LIKE '%threads%' OR LOWER(name) LIKE '%ثريدز%' THEN 'Threads'
    
    -- Spotify
    WHEN LOWER(name) LIKE '%spotify%' OR LOWER(name) LIKE '%سبوتيفاي%' THEN 'Spotify'
    
    -- SoundCloud
    WHEN LOWER(name) LIKE '%soundcloud%' OR LOWER(name) LIKE '%ساوند%' THEN 'SoundCloud'
    
    -- Keep as Other if no match
    ELSE 'Other'
END
WHERE platform = 'other' OR platform IS NULL;

-- Show results
SELECT 
    platform,
    COUNT(*) as service_count
FROM services
GROUP BY platform
ORDER BY service_count DESC;
