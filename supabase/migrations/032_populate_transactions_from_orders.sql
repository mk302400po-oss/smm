-- Migration to populate transactions from existing orders
-- This creates transaction records for all orders that don't have them yet

DO $$
DECLARE
    order_record RECORD;
    txn_number TEXT;
    egp_amount DECIMAL(10, 2);
BEGIN
    -- Loop through all orders that don't have a transaction yet
    FOR order_record IN 
        SELECT 
            o.id,
            o.user_id,
            o.total_price,
            o.created_at,
            s.name as service_name
        FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        WHERE NOT EXISTS (
            SELECT 1 FROM transactions t 
            WHERE t.order_id = o.id
        )
        ORDER BY o.created_at ASC
    LOOP
        -- Generate unique transaction number
        txn_number := 'TXN-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM transactions WHERE transaction_number = txn_number) LOOP
            txn_number := 'TXN-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        END LOOP;
        
        -- Convert USD to EGP (1 USD = 50.5 EGP)
        egp_amount := -(order_record.total_price * 50.5);
        
        -- Insert transaction record
        INSERT INTO transactions (
            user_id,
            amount_egp,
            amount_usd,
            type,
            description,
            order_id,
            service_name,
            transaction_number,
            created_at
        ) VALUES (
            order_record.user_id,
            egp_amount,
            -order_record.total_price, -- Negative for debit
            'debit',
            'شراء خدمة: ' || COALESCE(order_record.service_name, 'غير معروف'),
            order_record.id,
            order_record.service_name,
            txn_number,
            order_record.created_at -- Use original order creation time
        );
        
        RAISE NOTICE 'Created transaction for order: % (TXN: %)', order_record.id, txn_number;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verify the results
SELECT 
    COUNT(*) as total_orders,
    COUNT(DISTINCT t.order_id) as orders_with_transactions,
    COUNT(*) - COUNT(DISTINCT t.order_id) as orders_without_transactions
FROM orders o
LEFT JOIN transactions t ON o.id = t.order_id;
