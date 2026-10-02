-- Add active column to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add index
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);

-- Add active column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);
