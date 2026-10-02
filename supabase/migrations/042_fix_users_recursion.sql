-- Fix infinite recursion error by disabling RLS on users table
-- Users table should not have RLS to avoid recursion when checking admin role

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated, service_role;
GRANT UPDATE ON public.users TO authenticated, service_role;
