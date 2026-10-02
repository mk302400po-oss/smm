-- Create function to increment user balance
CREATE OR REPLACE FUNCTION increment_balance(user_id UUID, amount NUMERIC)
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
