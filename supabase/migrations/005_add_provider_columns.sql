-- Add provider_service_id to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS provider_service_id text;

-- Add provider_order_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_order_id text;
