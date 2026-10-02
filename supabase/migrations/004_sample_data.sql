-- Add sample services for testing
-- Run this in Supabase SQL Editor

-- Instagram Services
INSERT INTO public.services (platform, category, name, description, price_per_1000, min_quantity, max_quantity, status)
VALUES
('instagram', 'followers', 'Instagram Followers - High Quality',  'متابعين إنستقرام حقيقيين وعالي الجودة', 5.00, 100, 50000, 'active'),
('instagram', 'likes', 'Instagram Likes - Fast', 'لايكات سريعة للمنشورات', 2.50, 50, 10000, 'active'),
('instagram', 'views', 'Instagram Video Views', 'مشاهدات فيديوهات إنستقرام', 1.50, 100, 100000, 'active'),
('instagram', 'comments', 'Instagram Comments عربي', 'تعليقات عربية مخصصة', 15.00, 10, 1000, 'active'),

-- TikTok Services
('tiktok', 'followers', 'TikTok Followers - Real', 'متابعين تيك توك حقيقيين', 4.00, 100, 50000, 'active'),
('tiktok', 'likes', 'TikTok Likes - Instant', 'لايكات فورية لمقاطعك', 2.00, 50, 50000, 'active'),
('tiktok', 'views', 'TikTok Views - High Retention', 'مشاهدات عالية الثبات', 1.00, 1000, 1000000, 'active'),

-- Facebook Services
('facebook', 'followers', 'Facebook Page Followers', 'متابعين صفحة فيسبوك', 6.00, 100, 20000, 'active'),
('facebook', 'likes', 'Facebook Post Likes', 'لايكات منشورات فيسبوك', 3.00, 50, 10000, 'active'),

-- Twitter/X Services
('twitter', 'followers', 'Twitter/X Followers - Quality', 'متابعين تويتر عالي الجودة', 7.00, 100, 10000, 'active'),
('twitter', 'likes', 'Twitter/X Likes', 'لايكات تغريدات', 3.50, 20, 5000, 'active'),
('twitter', 'retweets', 'Twitter/X Retweets', 'إعادة تغريد', 4.50, 10, 2000, 'active'),

-- YouTube Services
('youtube', 'views', 'YouTube Views - Real', 'مشاهدات يوتيوب حقيقية', 2.00, 100, 100000, 'active'),
('youtube', 'likes', 'YouTube Likes', 'لايكات فيديوهات يوتيوب', 5.00, 50, 5000, 'active'),
('youtube', 'subscribers', 'YouTube Subscribers', 'مشتركين قناة يوتيوب', 10.00, 50, 5000, 'active'),
('youtube', 'comments', 'YouTube Comments', 'تعليقات يوتيوب مخصصة', 20.00, 5, 500, 'active');

-- Make current user an admin
UPDATE public.users 
SET role = 'admin'
WHERE email = 'mk302400po@gmail.com';
