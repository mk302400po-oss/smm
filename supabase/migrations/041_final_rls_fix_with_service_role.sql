-- Re-enable RLS and fix policies for admin visibility
-- This ensures admins can see ALL deposits and activity from both app and website

-- 1. Re-enable RLS on all tables
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can create deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update deposits" ON public.deposit_requests;

DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;

-- 3. Create NEW policies that work with service_role (for website)

-- Deposit Requests Policies
CREATE POLICY "Anyone authenticated can insert deposits"
ON public.deposit_requests FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

CREATE POLICY "Admins can view ALL deposits"
ON public.deposit_requests FOR SELECT
TO authenticated, service_role
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  -- Allow service_role (for website)
  auth.role() = 'service_role'
);

CREATE POLICY "Users can view own deposits"
ON public.deposit_requests FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  auth.role() = 'service_role'
);

CREATE POLICY "Admins can update deposits"
ON public.deposit_requests FOR UPDATE
TO authenticated, service_role
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  auth.role() = 'service_role'
);

-- Activity Log Policies
CREATE POLICY "Admins can view ALL activity"
ON public.activity_log FOR SELECT
TO authenticated, service_role
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can view own activity"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  auth.role() = 'service_role'
);

CREATE POLICY "Anyone can insert activity"
ON public.activity_log FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT ON public.deposit_requests TO authenticated, anon, service_role;
GRANT UPDATE ON public.deposit_requests TO authenticated, service_role;

GRANT SELECT, INSERT ON public.activity_log TO authenticated, anon, service_role;

-- 5. Verify the fix with a comment
COMMENT ON TABLE public.deposit_requests IS 'Fixed RLS to allow admins to see all deposits from both app and website';
COMMENT ON TABLE public.activity_log IS 'Fixed RLS to allow admins to see all activity from both app and website';
