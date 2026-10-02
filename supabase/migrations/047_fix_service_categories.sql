-- Fix services categories that are set to 'other'
-- Update them to proper categories based on service names

-- Update followers services
UPDATE public.services 
SET category = 'followers'
WHERE category = 'other' 
  AND (
    name ILIKE '%متابع%' OR 
    name ILIKE '%follower%' OR
    name ILIKE '%subscribers%' OR
    name ILIKE '%مشترك%'
  );

-- Update likes services
UPDATE public.services 
SET category = 'likes'
WHERE category = 'other' 
  AND (
    name ILIKE '%لايك%' OR 
    name ILIKE '%إعجاب%' OR
    name ILIKE '%like%' OR
    name ILIKE '%heart%' OR
    name ILIKE '%قلب%'
  );

-- Update views services
UPDATE public.services 
SET category = 'views'
WHERE category = 'other' 
  AND (
    name ILIKE '%مشاهد%' OR 
    name ILIKE '%view%' OR
    name ILIKE '%watch%'
  );

-- Update comments services
UPDATE public.services 
SET category = 'comments'
WHERE category = 'other' 
  AND (
    name ILIKE '%تعليق%' OR 
    name ILIKE '%comment%' OR
    name ILIKE '%رد%' OR
    name ILIKE '%reply%'
  );

-- Update shares services
UPDATE public.services 
SET category = 'shares'
WHERE category = 'other' 
  AND (
    name ILIKE '%مشارك%' OR 
    name ILIKE '%share%' OR
    name ILIKE '%نشر%'
  );

-- Update saves services
UPDATE public.services 
SET category = 'saves'
WHERE category = 'other' 
  AND (
    name ILIKE '%حفظ%' OR 
    name ILIKE '%save%'
  );

-- Check results
SELECT 
  platform,
  category,
  COUNT(*) as service_count
FROM public.services
GROUP BY platform, category
ORDER BY platform, category;
