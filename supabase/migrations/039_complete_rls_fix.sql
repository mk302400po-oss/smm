-- Complete fix for RLS policies to ensure data sync between website and app
-- This ensures admins can see ALL data from both website and app

-- 1. Fix activity_log RLS
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Service role can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;

-- Allow admins to see ALL activity logs
CREATE POLICY "Admins can view all activity"
ON public.activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to see their own activity
CREATE POLICY "Users can view own activity"
ON public.activity_log FOR SELECT
USING (auth.uid() = user_id);

-- Allow anyone authenticated to insert (for logging from website)
CREATE POLICY "Authenticated can insert activity"
ON public.activity_log FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. Fix deposit_requests RLS
DROP POLICY IF EXISTS "Users can create deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposit_requests;

-- Allow users to create deposits
CREATE POLICY "Users can create deposits"
ON public.deposit_requests FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow admins to see ALL deposits (from website and app)
CREATE POLICY "Admins can view all deposits"
ON public.deposit_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to see their own deposits
CREATE POLICY "Users can view own deposits"
ON public.deposit_requests FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to update deposits (approve/reject)
CREATE POLICY "Admins can update deposits"
ON public.deposit_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. Fix orders RLS  
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Allow users to create orders
CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow admins to see ALL orders
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to see their own orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to update orders (status changes)
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT ON public.activity_log TO authenticated, anon;
GRANT ALL ON public.activity_log TO service_role;

GRANT SELECT, INSERT ON public.deposit_requests TO authenticated, anon;
GRANT ALL ON public.deposit_requests TO service_role;

GRANT SELECT, INSERT ON public.orders TO authenticated, anon;
GRANT ALL ON public.orders TO service_role;

-- 5. Ensure admin_notifications work
DROP POLICY IF EXISTS "Admins can view own notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view own notifications"
ON public.admin_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND id = admin_id
  )
);

GRANT SELECT ON public.admin_notifications TO authenticated;
GRANT INSERT ON public.admin_notifications TO service_role, authenticated;
