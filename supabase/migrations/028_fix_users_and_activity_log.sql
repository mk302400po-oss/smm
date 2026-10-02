-- Fix users table schema and relationships
-- Add name column and fix activity_log foreign key

-- 1. Add name column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Update existing users to have a name (from email)
UPDATE public.users 
SET name = COALESCE(
  (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE auth.users.id = public.users.id),
  SPLIT_PART(email, '@', 1)
)
WHERE name IS NULL;

-- 3. Fix activity_log foreign key relationship
-- Drop old constraint if exists
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

-- Add proper foreign key
ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- 5. Update RLS policies for activity_log to work with users join
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_log;
CREATE POLICY "Users can view their own activities"
ON activity_log FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activities" ON activity_log;
CREATE POLICY "Admins can view all activities"
ON activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
