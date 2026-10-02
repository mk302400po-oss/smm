-- OneSignal Triggers
-- Triggers to send OneSignal push notifications

-- Function to send OneSignal notification via Edge Function
CREATE OR REPLACE FUNCTION send_onesignal_push()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  player_id_val TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_data JSON;
BEGIN
  -- Determine target user and notification content based on trigger
  IF TG_TABLE_NAME = 'deposit_requests' AND TG_OP = 'INSERT' THEN
    -- New deposit: notify all admins
    FOR player_id_val IN 
      SELECT onesignal_player_id 
      FROM users 
      WHERE role = 'admin' 
      AND onesignal_player_id IS NOT NULL
    LOOP
      notification_title := 'طلب إيداع جديد';
      notification_message := 'تم استلام طلب إيداع جديد بمبلغ $' || NEW.amount::TEXT;
      notification_data := json_build_object('type', 'deposit', 'id', NEW.id);
      
      -- Call Edge Function
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-onesignal-notification',
        headers := json_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
        )::JSONB,
        body := json_build_object(
          'player_id', player_id_val,
          'title', notification_title,
          'message', notification_message,
          'data', notification_data
        )::JSONB
      );
    END LOOP;
    
  ELSIF TG_TABLE_NAME = 'deposit_requests' AND TG_OP = 'UPDATE' THEN
    -- Deposit status changed: notify user
    IF OLD.status != NEW.status THEN
      SELECT onesignal_player_id INTO player_id_val
      FROM users 
      WHERE id = NEW.user_id;
      
      IF player_id_val IS NOT NULL THEN
        IF NEW.status = 'approved' THEN
          notification_title := 'تم قبول طلب الإيداع';
          notification_message := 'تمت الموافقة على طلب إيداعك بمبلغ $' || NEW.amount::TEXT;
        ELSIF NEW.status = 'rejected' THEN
          notification_title := 'تم رفض طلب الإيداع';
          notification_message := 'تم رفض طلب إيداعك';
        END IF;
        
        notification_data := json_build_object('type', 'deposit_status', 'id', NEW.id, 'status', NEW.status);
        
        PERFORM net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/send-onesignal-notification',
          headers := json_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
          )::JSONB,
          body := json_build_object(
            'player_id', player_id_val,
            'title', notification_title,
            'message', notification_message,
            'data', notification_data
          )::JSONB
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS onesignal_deposit_insert ON deposit_requests;
CREATE TRIGGER onesignal_deposit_insert
  AFTER INSERT ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_push();

DROP TRIGGER IF EXISTS onesignal_deposit_update ON deposit_requests;
CREATE TRIGGER onesignal_deposit_update
  AFTER UPDATE ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_push();
