-- Add admin_id column to deposit_requests table
-- This column is used to track which admin approved or rejected a deposit request

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'deposit_requests'
        AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.deposit_requests
        ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
