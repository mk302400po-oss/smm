-- Simpler RLS Policies for Services Table
-- Using service_role bypass for testing

-- First, check if RLS is enabled
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.services;

-- Create simple policy: Allow ALL operations for authenticated users
-- (We'll restrict to admin-only later once we confirm it works)
CREATE POLICY "Enable all for authenticated users" ON public.services
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
