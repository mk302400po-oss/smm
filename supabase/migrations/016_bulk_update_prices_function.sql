-- Create a function to bulk update all service prices
-- This is much faster than updating each service individually from the client

CREATE OR REPLACE FUNCTION bulk_update_prices(
    adjustment_amount NUMERIC,
    adjustment_type TEXT -- 'percent' or 'fixed'
)
RETURNS TABLE (
    updated_count INTEGER,
    error_count INTEGER
) AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_temp_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    -- Update services with price (fixed price)
    IF adjustment_type = 'percent' THEN
        UPDATE services 
        SET price = price * (1 + adjustment_amount / 100)
        WHERE price IS NOT NULL;
    ELSE
        UPDATE services 
        SET price = price + adjustment_amount
        WHERE price IS NOT NULL;
    END IF;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Update services with price_per_1000
    IF adjustment_type = 'percent' THEN
        UPDATE services 
        SET price_per_1000 = price_per_1000 * (1 + adjustment_amount / 100)
        WHERE price_per_1000 IS NOT NULL;
    ELSE
        UPDATE services 
        SET price_per_1000 = price_per_1000 + adjustment_amount
        WHERE price_per_1000 IS NOT NULL;
    END IF;

    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_updated_count := v_updated_count + v_temp_count;

    RETURN QUERY SELECT v_updated_count, v_error_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
