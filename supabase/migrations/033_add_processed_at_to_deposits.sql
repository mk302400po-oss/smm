-- Add processed_at column to deposit_requests table
-- This column is used to store the timestamp when a deposit was approved or rejected

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'deposit_requests'
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.deposit_requests
        ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
