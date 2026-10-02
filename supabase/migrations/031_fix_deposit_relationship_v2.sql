-- Add foreign key relationship between deposit_requests and public.users table
-- We use a specific name 'deposit_requests_public_users_fkey' to avoid conflict with the existing foreign key to auth.users

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'deposit_requests_public_users_fkey'
        AND table_name = 'deposit_requests'
    ) THEN
        ALTER TABLE public.deposit_requests
        ADD CONSTRAINT deposit_requests_public_users_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;
