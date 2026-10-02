-- Add sender_phone column to deposit_requests table

ALTER TABLE deposit_requests 
ADD COLUMN IF NOT EXISTS sender_phone TEXT;

-- Index for faster searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_deposit_requests_sender_phone 
ON deposit_requests(sender_phone);
