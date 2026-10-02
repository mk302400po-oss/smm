-- IMPORTANT: Before running this migration, replace these placeholders:
-- 1. Replace YOUR_PROJECT_REF with your Supabase project reference
-- 2. Replace YOUR_SERVICE_ROLE_KEY with your Service Role Key from Supabase Settings → API

-- Database triggers for sending push notifications

-- Enable HTTP extension for calling Edge Functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to notify admin about new user registration
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function asynchronously (fire and forget)
  PERFORM extensions.http_post(
    'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-notification',
    json_build_object(
      'type', 'admin',
      'event', 'user_registered',
      'title', 'مستخدم جديد',
      'body', 'تسجيل مستخدم جديد: ' || NEW.email,
      'data', json_build_object('user_id', NEW.id, 'email', NEW.email)
    )::text,
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MTIyMiwiZXhwIjoyMDgyOTI3MjIyfQ.grXBI8JeXY4ZcwyRtLP0BdmKo0CVh531zfteN0AKv90'),
      extensions.http_header('Content-Type', 'application/json')
    ]
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user registration
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_user_registered_notify ON auth.users;
CREATE TRIGGER on_user_registered_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_user();

-- Function to notify admin about new deposit request
CREATE OR REPLACE FUNCTION notify_admin_new_deposit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Only for pending deposits
  IF NEW.status = 'pending' THEN
    -- Get user email
    SELECT email INTO v_user_email
    FROM public.users
    WHERE id = NEW.user_id;
    
    PERFORM extensions.http_post(
      'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-notification',
      json_build_object(
        'type', 'admin',
        'event', 'deposit_requested',
        'title', 'طلب إيداع جديد',
        'body', 'طلب إيداع بقيمة: $' || NEW.amount::text || ' من ' || COALESCE(v_user_email, 'مستخدم'),
        'data', json_build_object('deposit_id', NEW.id, 'amount', NEW.amount, 'user_id', NEW.user_id)
      )::text,
      'application/json',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MTIyMiwiZXhwIjoyMDgyOTI3MjIyfQ.grXBI8JeXY4ZcwyRtLP0BdmKo0CVh531zfteN0AKv90'),
        extensions.http_header('Content-Type', 'application/json')
      ]
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new deposit request
DROP TRIGGER IF EXISTS on_deposit_requested_notify ON deposit_requests;
CREATE TRIGGER on_deposit_requested_notify
  AFTER INSERT ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_deposit();

-- Function to notify user about deposit status change
CREATE OR REPLACE FUNCTION notify_user_deposit_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only when status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    PERFORM extensions.http_post(
      'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-notification',
      json_build_object(
        'type', 'user',
        'user_id', NEW.user_id,
        'event', 'deposit_' || NEW.status,
        'title', CASE 
          WHEN NEW.status = 'approved' THEN 'تم قبول الإيداع ✅'
          ELSE 'تم رفض الإيداع ❌'
        END,
        'body', 'إيداع بقيمة: $' || NEW.amount::text,
        'data', json_build_object('deposit_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
      )::text,
      'application/json',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MTIyMiwiZXhwIjoyMDgyOTI3MjIyfQ.grXBI8JeXY4ZcwyRtLP0BdmKo0CVh531zfteN0AKv90'),
        extensions.http_header('Content-Type', 'application/json')
      ]
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for deposit status change
DROP TRIGGER IF EXISTS on_deposit_status_changed_notify ON deposit_requests;
CREATE TRIGGER on_deposit_status_changed_notify
  AFTER UPDATE ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_deposit_status();

-- Function to notify admin about new order
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_service_name TEXT;
BEGIN
  -- Get user email and service name
  SELECT u.email, s.name INTO v_user_email, v_service_name
  FROM public.users u, public.services s
  WHERE u.id = NEW.user_id AND s.id = NEW.service_id;
  
  PERFORM extensions.http_post(
    'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-notification',
    json_build_object(
      'type', 'admin',
      'event', 'order_created',
      'title', 'طلب جديد',
      'body', 'طلب جديد: ' || COALESCE(v_service_name, 'خدمة') || ' من ' || COALESCE(v_user_email, 'مستخدم'),
      'data', json_build_object('order_id', NEW.id, 'service_name', v_service_name, 'user_id', NEW.user_id)
    )::text,
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MTIyMiwiZXhwIjoyMDgyOTI3MjIyfQ.grXBI8JeXY4ZcwyRtLP0BdmKo0CVh531zfteN0AKv90'),
      extensions.http_header('Content-Type', 'application/json')
    ]
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new order
DROP TRIGGER IF EXISTS on_order_created_notify ON orders;
CREATE TRIGGER on_order_created_notify
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_order();

-- Function to notify user about order status change
CREATE OR REPLACE FUNCTION notify_user_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
  v_status_ar TEXT;
BEGIN
  -- Only when status actually changes
  IF OLD.status != NEW.status THEN
    -- Get service name
    SELECT name INTO v_service_name
    FROM public.services
    WHERE id = NEW.service_id;
    
    -- Translate status to Arabic
    v_status_ar := CASE NEW.status
      WHEN 'pending' THEN 'قيد الانتظار'
      WHEN 'processing' THEN 'قيد المعالجة'
      WHEN 'completed' THEN 'مكتمل'
      WHEN 'cancelled' THEN 'ملغي'
      WHEN 'partial' THEN 'جزئي'
      ELSE NEW.status
    END;
    
    PERFORM extensions.http_post(
      'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-notification',
      json_build_object(
        'type', 'user',
        'user_id', NEW.user_id,
        'event', 'order_status_changed',
        'title', 'تحديث حالة الطلب',
        'body', COALESCE(v_service_name, 'طلبك') || ': ' || v_status_ar,
        'data', json_build_object('order_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
      )::text,
      'application/json',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MTIyMiwiZXhwIjoyMDgyOTI3MjIyfQ.grXBI8JeXY4ZcwyRtLP0BdmKo0CVh531zfteN0AKv90'),
        extensions.http_header('Content-Type', 'application/json')
      ]
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status change
DROP TRIGGER IF EXISTS on_order_status_changed_notify ON orders;
CREATE TRIGGER on_order_status_changed_notify
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_order_status();
