-- Fix Duplicate Notifications - Complete Clean Up
-- Run this SQL in Supabase SQL Editor

-- 1. Drop ALL old notification triggers from deposit_requests
DROP TRIGGER IF EXISTS on_deposit_insert_notify_admin ON deposit_requests CASCADE;
DROP TRIGGER IF EXISTS on_deposit_request_created ON deposit_requests CASCADE;
DROP TRIGGER IF EXISTS on_deposit_requested_notify ON deposit_requests CASCADE;
DROP TRIGGER IF EXISTS on_deposit_status_notify_user ON deposit_requests CASCADE;
DROP TRIGGER IF EXISTS onesignal_deposit_insert ON deposit_requests CASCADE;
DROP TRIGGER IF EXISTS onesignal_deposit_update ON deposit_requests CASCADE;

-- 2. Drop old notification functions (if they exist)
DROP FUNCTION IF EXISTS notify_admin_deposit CASCADE;
DROP FUNCTION IF EXISTS notify_deposit_request CASCADE;
DROP FUNCTION IF EXISTS notify_deposit_status CASCADE;
DROP FUNCTION IF EXISTS handle_onesignal_deposit CASCADE;

-- 3. Verify only essential triggers remain
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'deposit_requests'::regclass
AND tgname NOT LIKE 'RI_%';

-- Expected result: Only 'set_deposit_requests_updated_at' should remain
