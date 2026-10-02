-- Increase precision of price columns to handle much larger values
-- Previous: NUMERIC(12,4) - max 99,999,999.9999
-- New: NUMERIC(15,4) - max 99,999,999,999.9999 (11 digits before decimal)

ALTER TABLE services 
ALTER COLUMN price TYPE NUMERIC(15,4);

ALTER TABLE services 
ALTER COLUMN price_per_1000 TYPE NUMERIC(15,4);
