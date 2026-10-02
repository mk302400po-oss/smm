-- Restore Notification Trigger for Edge Function
-- Run this SQL in Supabase SQL Editor

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Re-create function to call Edge Function
CREATE OR REPLACE FUNCTION trigger_send_fcm_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-fcm-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTEyMjIsImV4cCI6MjA4MjkyNzIyMn0.jT49Fz2D6OV5D52g9R3FSNwMaTBDH4vWx9UzGCUCm0M'
      ),
      body := jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message
      )
    );
  
  RETURN NEW;
END;
$function$;

-- Re-create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
CREATE TRIGGER on_notification_insert
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION trigger_send_fcm_notification();

-- Verify trigger exists
SELECT tgname FROM pg_trigger WHERE tgrelid = 'notifications'::regclass;
-- Should show: on_notification_insert
