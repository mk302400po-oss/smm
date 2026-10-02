-- Add 'price' column to services table
-- The original schema uses 'price_per_1000', but our admin interface uses 'price'
-- We'll add 'price' and make 'price_per_1000' optional for backwards compatibility

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Make price_per_1000 nullable for new services that use 'price' instead
ALTER TABLE public.services 
ALTER COLUMN price_per_1000 DROP NOT NULL;

-- Set default values - copy price_per_1000 to price for existing records
UPDATE public.services 
SET price = price_per_1000 
WHERE price IS NULL AND price_per_1000 IS NOT NULL;
