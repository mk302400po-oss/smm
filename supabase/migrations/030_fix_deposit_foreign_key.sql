-- Add foreign key relationship between deposit_requests and users table
-- This allows performing joins to fetch user details with deposits (e.g. user:users(name, email))

DO $$
BEGIN
    -- Check if the constraint already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'deposit_requests_user_id_fkey'
        AND table_name = 'deposit_requests'
    ) THEN
        ALTER TABLE public.deposit_requests
        ADD CONSTRAINT deposit_requests_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;
