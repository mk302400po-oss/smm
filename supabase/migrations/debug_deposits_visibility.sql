-- Debug queries to check why website deposits are not showing in app

-- 1. Check all deposits (ignore RLS)
-- Run this as service_role or in SQL editor
SELECT 
    d.id,
    d.user_id,
    d.amount,
    d.status,
    d.payment_method,
    d.created_at,
    u.name as user_name,
    u.email as user_email
FROM public.deposit_requests d
LEFT JOIN public.users u ON u.id = d.user_id
ORDER BY d.created_at DESC
LIMIT 20;

-- 2. Check if user_id exists in public.users table
SELECT 
    d.id as deposit_id,
    d.user_id,
    CASE 
        WHEN u.id IS NULL THEN 'USER NOT FOUND IN PUBLIC.USERS'
        ELSE 'USER EXISTS'
    END as user_status,
    d.amount,
    d.created_at
FROM public.deposit_requests d
LEFT JOIN public.users u ON u.id = d.user_id
WHERE u.id IS NULL;

-- 3. Check RLS policies on deposit_requests
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'deposit_requests';

-- 4. Check if RLS is enabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'deposit_requests';

-- 5. Count deposits by source
SELECT 
    COUNT(*) as total_deposits,
    COUNT(CASE WHEN user_id IN (SELECT id FROM public.users) THEN 1 END) as with_valid_user,
    COUNT(CASE WHEN user_id NOT IN (SELECT id FROM public.users) THEN 1 END) as with_invalid_user
FROM public.deposit_requests;
