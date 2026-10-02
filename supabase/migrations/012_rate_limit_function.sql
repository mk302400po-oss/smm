-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_ip text,
    p_endpoint text,
    p_limit int,
    p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
DECLARE
    current_count int;
    last_req timestamptz;
BEGIN
    -- Check if record exists
    SELECT count, last_request INTO current_count, last_req
    FROM rate_limits
    WHERE ip = p_ip AND endpoint = p_endpoint;

    -- If no record, insert new
    IF NOT FOUND THEN
        INSERT INTO rate_limits (ip, endpoint, count, last_request)
        VALUES (p_ip, p_endpoint, 1, now());
        RETURN true;
    END IF;

    -- If window expired, reset
    IF now() - last_req > (p_window_seconds || ' seconds')::interval THEN
        UPDATE rate_limits
        SET count = 1, last_request = now()
        WHERE ip = p_ip AND endpoint = p_endpoint;
        RETURN true;
    END IF;

    -- If within window, check limit
    IF current_count >= p_limit THEN
        RETURN false; -- Blocked
    ELSE
        UPDATE rate_limits
        SET count = count + 1, last_request = now()
        WHERE ip = p_ip AND endpoint = p_endpoint;
        RETURN true; -- Allowed
    END IF;
END;
$$;
