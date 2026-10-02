-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_request TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip, endpoint);

-- RLS for rate_limits (Admin only)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access"
ON rate_limits
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Function to clean up old rate limits (can be called via cron or periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM rate_limits WHERE last_request < now() - INTERVAL '1 hour';
END;
$$;
