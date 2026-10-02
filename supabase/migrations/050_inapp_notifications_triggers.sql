-- In-App Notifications Triggers (Fixed for existing constraints)
-- Uses 'info' type to avoid check constraint violations

-- Function to create notification for admin on new deposit
CREATE OR REPLACE FUNCTION create_admin_deposit_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admin users
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    id,
    'طلب إيداع جديد',
    'طلب إيداع بقيمة ' || NEW.amount::text || ' ج.م',
    'info'
  FROM users
  WHERE role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify user about deposit status change
CREATE OR REPLACE FUNCTION create_user_deposit_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only notify on status change from pending
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    IF NEW.status = 'approved' THEN
      v_title := 'تم قبول الإيداع ✅';
      v_message := 'تم قبول إيداعك بقيمة ' || NEW.amount::text || ' ج.م وتمت إضافة الرصيد';
      v_type := 'success';
    ELSE
      v_title := 'تم رفض الإيداع ❌';
      v_message := 'تم رفض طلب الإيداع بقيمة ' || NEW.amount::text || ' ج.م';
      v_type := 'error';
    END IF;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.user_id, v_title, v_message, v_type);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify admin about new order
CREATE OR REPLACE FUNCTION create_admin_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
BEGIN
  -- Get service name
  SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
  
  -- Insert notification for all admins
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    id,
    'طلب جديد',
    'طلب جديد: ' || COALESCE(v_service_name, 'خدمة'),
    'info'
  FROM users
  WHERE role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify user about order status change
CREATE OR REPLACE FUNCTION create_user_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
  v_status_ar TEXT;
  v_type TEXT;
BEGIN
  -- Only notify on actual status change
  IF OLD.status != NEW.status THEN
    -- Get service name
    SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
    
    -- Translate status to Arabic and set type
    CASE NEW.status
      WHEN 'completed' THEN
        v_status_ar := 'مكتمل';
        v_type := 'success';
      WHEN 'cancelled' THEN
        v_status_ar := 'ملغي';
        v_type := 'error';
      WHEN 'processing' THEN
        v_status_ar := 'قيد المعالجة';
        v_type := 'info';
      WHEN 'partial' THEN
        v_status_ar := 'جزئي';
        v_type := 'warning';
      ELSE
        v_status_ar := 'قيد الانتظار';
        v_type := 'info';
    END CASE;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'تحديث حالة الطلب',
      COALESCE(v_service_name, 'طلبك') || ': ' || v_status_ar,
      v_type
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_deposit_insert_notify_admin ON deposit_requests;
CREATE TRIGGER on_deposit_insert_notify_admin
  AFTER INSERT ON deposit_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION create_admin_deposit_notification();

DROP TRIGGER IF EXISTS on_deposit_status_notify_user ON deposit_requests;
CREATE TRIGGER on_deposit_status_notify_user
  AFTER UPDATE ON deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_user_deposit_status_notification();

DROP TRIGGER IF EXISTS on_order_insert_notify_admin ON orders;
CREATE TRIGGER on_order_insert_notify_admin
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_order_notification();

DROP TRIGGER IF EXISTS on_order_status_notify_user ON orders;
CREATE TRIGGER on_order_status_notify_user
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_user_order_status_notification();
