-- Add order-related columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_number TEXT UNIQUE;

-- Create index for transaction_number
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number ON transactions(transaction_number);

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate format: TXN-YYYYMMDD-RANDOM6DIGITS
        new_number := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if exists
        IF NOT EXISTS (SELECT 1 FROM transactions WHERE transaction_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique transaction number after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN transactions.order_id IS 'Reference to order if transaction is for a purchase';
COMMENT ON COLUMN transactions.service_name IS 'Name of service purchased (for order transactions)';
COMMENT ON COLUMN transactions.transaction_number IS 'Unique transaction identifier';
