-- Create a highly secure function for atomic balance deduction
-- This prevents race conditions where a user sends multiple concurrent requests
-- to place orders and bypasses the balance check.

CREATE OR REPLACE FUNCTION secure_deduct_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    -- Lock the row for update to prevent concurrent modifications
    SELECT balance INTO current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF current_balance IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF current_balance < p_amount THEN
        -- Balance is insufficient
        RETURN FALSE;
    END IF;

    -- Update balance safely
    UPDATE users
    SET balance = balance - p_amount
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;
