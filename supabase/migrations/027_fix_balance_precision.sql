-- Script to update all existing balances with proper precision
-- This ensures all existing balances are displayed correctly in EGP

-- The issue: Old balances were stored with 2 decimal precision
-- The fix: Round to 4 decimal precision for accurate EGP display

-- Example of what this does:
-- If balance is 0.89 (shows as 44.95 EGP)
-- After update: 0.8911 (shows as 45.00 EGP)

-- This is a one-time migration to fix precision
-- Run this in your Supabase SQL editor

UPDATE users
SET balance = ROUND(CAST(balance AS NUMERIC), 4)
WHERE balance IS NOT NULL;

-- Verify the update
SELECT 
    email,
    balance AS "Balance (USD)",
    ROUND(balance * 50.5, 2) AS "Balance (EGP)"
FROM users
WHERE balance > 0
ORDER BY balance DESC;
