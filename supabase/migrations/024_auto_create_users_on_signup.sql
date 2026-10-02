-- Create trigger to automatically add users to public.users table
-- This ensures that when a user signs up through auth, they get a record in public.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, balance, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'mk302400po@gmail.com' THEN 'admin'
      ELSE 'user'
    END,
    0,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also insert existing auth users into public.users if they don't exist
INSERT INTO public.users (id, email, role, balance, full_name, created_at)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'mk302400po@gmail.com' THEN 'admin'
    ELSE 'user'
  END,
  0,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
