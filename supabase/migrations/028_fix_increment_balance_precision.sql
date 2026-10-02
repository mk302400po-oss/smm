-- Update increment_balance function to use proper precision
-- This fixes the issue where balances are rounded to 2 decimal places

DROP FUNCTION IF EXISTS increment_balance(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION increment_balance(user_id UUID, amount NUMERIC(10,4))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET balance = ROUND(CAST(COALESCE(balance, 0) + amount AS NUMERIC), 4)
    WHERE id = user_id;
END;
$$;
