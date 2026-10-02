-- Fix Activity Log and ensure sync between website and app
-- This migration ensures all data syncs properly and RLS policies are correct

-- 1. Ensure activity_log has proper RLS for admins
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
CREATE POLICY "Admins can view all activity"
ON public.activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 2. Add INSERT policy for activity_log (for service role)
DROP POLICY IF EXISTS "Service role can insert activity" ON public.activity_log;
CREATE POLICY "Service role can insert activity"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- 3. Ensure deposit_requests sync properly
-- Add INSERT policy for authenticated users
DROP POLICY IF EXISTS "Users can create deposit requests" ON public.deposit_requests;
CREATE POLICY "Users can create deposit requests"
ON public.deposit_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure admins can see ALL deposit requests (from website and app)
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposit_requests;
CREATE POLICY "Admins can view all deposits"
ON public.deposit_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR auth.uid() = user_id
);

-- 5. Grant necessary permissions
GRANT SELECT ON public.activity_log TO authenticated;
GRANT INSERT ON public.activity_log TO authenticated, service_role;

GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
GRANT UPDATE ON public.deposit_requests TO service_role;
GRANT ALL ON public.deposit_requests TO service_role;
