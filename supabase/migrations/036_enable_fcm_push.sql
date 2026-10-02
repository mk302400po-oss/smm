-- Migration to enable FCM Push Notifications via Edge Functions
-- This requires pg_net extension to be enabled

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create app schema for settings if not exists
CREATE SCHEMA IF NOT EXISTS app;

-- Create settings table for storing Supabase credentials
CREATE TABLE IF NOT EXISTS app.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: You must manually insert your credentials:
-- INSERT INTO app.settings (key, value) VALUES
-- ('supabase_url', 'YOUR_SUPABASE_URL'),
-- ('service_role_key', 'YOUR_SERVICE_ROLE_KEY');

-- Function to call Edge Function for sending FCM notifications
CREATE OR REPLACE FUNCTION send_fcm_notification(
    p_title TEXT,
    p_body TEXT,
    p_type TEXT,
    p_reference_id UUID
)
RETURNS void AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_request_id BIGINT;
BEGIN
    -- Get Supabase URL and Service Role Key from settings
    SELECT value INTO v_supabase_url FROM app.settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_role_key FROM app.settings WHERE key = 'service_role_key';
    
    -- Call Edge Function using pg_net
    SELECT net.http_post(
        url := v_supabase_url || '/functions/v1/send-admin-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
            'title', p_title,
            'body', p_body,
            'type', p_type,
            'reference_id', p_reference_id::text
        )
    ) INTO v_request_id;
    
    -- Log the request (optional, for debugging)
    RAISE NOTICE 'FCM request sent with ID: %', v_request_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE NOTICE 'Failed to send FCM: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update deposit trigger to send FCM notification
CREATE OR REPLACE FUNCTION notify_admins_new_deposit_fcm()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification in database (for in-app notifications)
    INSERT INTO public.admin_notifications (admin_id, title, body, type, reference_id)
    SELECT u.id, 
           'طلب إيداع جديد',
           'طلب إيداع بقيمة $' || NEW.amount::TEXT,
           'deposit',
           NEW.id
    FROM public.users u
    WHERE u.role = 'admin';
    
    -- Send FCM Push Notification
    PERFORM send_fcm_notification(
        'طلب إيداع جديد',
        'طلب إيداع بقيمة $' || NEW.amount::TEXT,
        'deposit',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_deposit_request_created ON public.deposit_requests;
CREATE TRIGGER on_deposit_request_created
    AFTER INSERT ON public.deposit_requests
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_admins_new_deposit_fcm();

-- Update order trigger to send FCM notification
CREATE OR REPLACE FUNCTION notify_admins_new_order_fcm()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification in database (for in-app notifications)
    INSERT INTO public.admin_notifications (admin_id, title, body, type, reference_id)
    SELECT u.id,
           'طلب خدمة جديد',
           'طلب خدمة جديد بقيمة $' || NEW.total_price::TEXT,
           'order',
           NEW.id
    FROM public.users u
    WHERE u.role = 'admin';
    
    -- Send FCM Push Notification
    PERFORM send_fcm_notification(
        'طلب خدمة جديد',
        'طلب خدمة جديد بقيمة $' || NEW.total_price::TEXT,
        'order',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_new_order_fcm();
