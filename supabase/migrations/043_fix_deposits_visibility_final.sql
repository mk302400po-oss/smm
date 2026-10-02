-- Complete fix for deposits visibility between website and app
-- This ensures ALL deposits are visible regardless of source

-- Step 1: Temporarily disable RLS to check data
ALTER TABLE public.deposit_requests DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if deposits exist and their user_ids are valid
-- (Run the debug queries first to see the issue)

-- Step 3: Re-enable RLS with PROPER policies
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone authenticated can insert deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view ALL deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Service role can insert" ON public.deposit_requests;

-- Step 5: Create SIMPLE policies that work for EVERYONE

-- Allow ANYONE (app, website, anon) to insert deposits
CREATE POLICY "Allow all inserts"
ON public.deposit_requests 
FOR INSERT
WITH CHECK (true);

-- Allow admins to see EVERYTHING (no user_id check needed)
CREATE POLICY "Admins see all"
ON public.deposit_requests 
FOR SELECT
USING (
  -- If user is admin
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to see their own
CREATE POLICY "Users see own"
ON public.deposit_requests 
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to update
CREATE POLICY "Admins can update"
ON public.deposit_requests 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Step 6: Grant permissions to ALL roles
GRANT ALL ON public.deposit_requests TO service_role;
GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
GRANT INSERT ON public.deposit_requests TO anon;

-- Step 7: Verify the fix
SELECT 'RLS Status:', 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'deposit_requests' AND schemaname = 'public';

SELECT 'Policies Count:', COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'deposit_requests';
