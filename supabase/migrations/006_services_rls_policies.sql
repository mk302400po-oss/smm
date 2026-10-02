-- Add RLS Policies for Services Table
-- This allows admins to manage services and users to read them

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

-- Allow all authenticated users to read services
CREATE POLICY "Users can view all services" ON public.services
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to insert services
CREATE POLICY "Admins can insert services" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update services
CREATE POLICY "Admins can update services" ON public.services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete services
CREATE POLICY "Admins can delete services" ON public.services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
