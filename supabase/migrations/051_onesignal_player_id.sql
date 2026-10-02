-- OneSignal Player ID Migration
-- Add onesignal_player_id column to users table

-- Add column for OneSignal Player ID
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_onesignal_player_id 
ON users(onesignal_player_id);

-- Comment explaining the column
COMMENT ON COLUMN users.onesignal_player_id IS 'OneSignal Player ID for push notifications';
