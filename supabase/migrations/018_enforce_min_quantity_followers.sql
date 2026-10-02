-- Enforce minimum quantity of 1000 for all "followers" services
-- This updates existing records

UPDATE services
SET min_quantity = 1000
WHERE category = 'followers' AND (min_quantity < 1000 OR min_quantity IS NULL);

-- Optional: You might want to ensure new inserts also follow this, 
-- but we are handling that in the application logic (Admin UI).
-- A CHECK constraint could be added if strict database-level enforcement is desired,
-- but for now, we'll stick to data cleanup and app-level validation.
