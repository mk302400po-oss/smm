-- Create FCM tokens table for push notifications
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT CHECK (device_type IN ('android', 'ios', 'web')),
    device_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own tokens"
    ON public.fcm_tokens
    FOR ALL
    USING (auth.uid() = user_id);

-- Function to upsert FCM token
CREATE OR REPLACE FUNCTION upsert_fcm_token(
    p_user_id UUID,
    p_token TEXT,
    p_device_type TEXT,
    p_device_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.fcm_tokens (user_id, token, device_type, device_name)
    VALUES (p_user_id, p_token, p_device_type, p_device_name)
    ON CONFLICT (token)
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        device_type = EXCLUDED.device_type,
        device_name = EXCLUDED.device_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin FCM tokens
CREATE OR REPLACE FUNCTION get_admin_fcm_tokens()
RETURNS TABLE(token TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT ft.token
    FROM public.fcm_tokens ft
    JOIN public.users u ON u.id = ft.user_id
    WHERE u.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
