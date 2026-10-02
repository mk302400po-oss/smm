-- DEBUG: Let's check what's actually in the database
-- Run these queries in Supabase SQL Editor to see your data

-- 1. Check deposits
SELECT 
    id, 
    user_id, 
    amount, 
    status, 
    created_at,
    screenshot_url
FROM public.deposit_requests
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check orders  
SELECT 
    id,
    user_id,
    service_id,
    status,
    total_price,
    created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check activity_log
SELECT 
    id,
    user_id,
    action_type,
    description,
    created_at
FROM public.activity_log
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('deposit_requests', 'orders', 'activity_log')
ORDER BY tablename, policyname;

-- 5. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('deposit_requests', 'orders', 'activity_log');
