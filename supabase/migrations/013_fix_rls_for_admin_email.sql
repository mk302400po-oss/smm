-- Fix RLS policies to explicitly allow the admin email
-- This ensures the developer/admin can always manage services even if the JWT role claim is missing

DROP POLICY IF EXISTS "Allow admin insert" ON services;
DROP POLICY IF EXISTS "Allow admin update" ON services;
DROP POLICY IF EXISTS "Allow admin delete" ON services;

CREATE POLICY "Allow admin insert"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() ->> 'email') = 'mk302400po@gmail.com'
);

CREATE POLICY "Allow admin update"
ON services FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() ->> 'email') = 'mk302400po@gmail.com'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() ->> 'email') = 'mk302400po@gmail.com'
);

CREATE POLICY "Allow admin delete"
ON services FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() ->> 'email') = 'mk302400po@gmail.com'
);
