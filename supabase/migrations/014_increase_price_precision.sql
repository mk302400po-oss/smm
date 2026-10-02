-- Increase precision of price columns to handle larger values
-- Current: NUMERIC(10,2) - max 99,999,999.99
-- New: NUMERIC(12,4) - max 99,999,999.9999 with more decimal precision

ALTER TABLE services 
ALTER COLUMN price TYPE NUMERIC(12,4);

ALTER TABLE services 
ALTER COLUMN price_per_1000 TYPE NUMERIC(12,4);
