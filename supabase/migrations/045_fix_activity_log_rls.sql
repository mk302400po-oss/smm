-- Fix activity_log visibility for admin panel

-- 1. Disable RLS temporarily to check if that's the issue
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone can insert activity" ON public.activity_log;

-- 3. Re-enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 4. Create simple policies
CREATE POLICY "select_admin"
ON public.activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "select_own"
ON public.activity_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "insert_all"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- 5. Grant permissions
GRANT ALL ON public.activity_log TO service_role;
GRANT SELECT, INSERT ON public.activity_log TO authenticated;

-- 6. Verify
SELECT 'Activity Log Table' as check, COUNT(*) as total_records
FROM public.activity_log;
