-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON services;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON services;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON services;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON services;
DROP POLICY IF EXISTS "Allow public read access" ON services;
DROP POLICY IF EXISTS "Allow admin full access" ON services;

-- Policy 1: Allow everyone (including anon) to view active services
-- We might want to restrict this to authenticated users only depending on requirements, 
-- but usually landing pages need to see services too. 
-- For now, let's allow authenticated users to see all, and maybe anon to see active.
CREATE POLICY "Allow read access for all authenticated users"
ON services FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to INSERT
CREATE POLICY "Allow admin insert"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Policy 3: Allow only admins to UPDATE
CREATE POLICY "Allow admin update"
ON services FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Policy 4: Allow only admins to DELETE
CREATE POLICY "Allow admin delete"
ON services FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
