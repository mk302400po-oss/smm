-- TEMPORARY FIX: Disable RLS temporarily to debug the issue
-- This will help us confirm if RLS is the problem

-- Temporarily disable RLS on these tables
ALTER TABLE public.deposit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;

-- NOTE: This is INSECURE and should only be used for testing
-- After confirming data appears, we'll re-enable RLS with correct policies

-- To re-enable later, run:
-- ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
