-- Trigger to automatically create user profile in 'users' table after signup
-- This ensures name and email are properly saved from auth metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_created boolean;
BEGIN
  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    balance,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      'User'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      public.users.full_name
    )
  RETURNING (xmax = 0) INTO v_user_created;
  
  -- Only log activity if this is a NEW user (not an update)
  IF v_user_created THEN
    -- Simple insert without complex metadata
    INSERT INTO public.activity_log (user_id, action_type, description)
    VALUES (
      NEW.id,
      'user_registered',
      'تسجيل مستخدم جديد: ' || NEW.email
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also update existing users if name is missing
UPDATE public.users
SET full_name = COALESCE(
  (SELECT au.raw_user_meta_data->>'name' FROM auth.users au WHERE au.id = users.id),
  (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = users.id),
  users.full_name,
  'مستخدم'
)
WHERE full_name IS NULL OR full_name = '';
