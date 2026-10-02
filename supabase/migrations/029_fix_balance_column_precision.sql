-- Fix balance column precision to support 4 decimal places
-- This is the ROOT CAUSE of the issue

-- Step 1: Alter the column to support 4 decimal places
ALTER TABLE users 
ALTER COLUMN balance TYPE DECIMAL(10, 4);

-- Step 2: Update the increment_balance function
DROP FUNCTION IF EXISTS increment_balance(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION increment_balance(user_id UUID, amount NUMERIC(10,4))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET balance = COALESCE(balance, 0) + amount
    WHERE id = user_id;
END;
$$;

-- Step 3: Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'balance';
-- Should show: numeric_precision=10, numeric_scale=4
