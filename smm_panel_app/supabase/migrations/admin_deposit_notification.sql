-- Notify Admin on New Deposit Request
-- This sends notification to admin when user creates deposit request

-- Create function to notify admin on new deposit
CREATE OR REPLACE FUNCTION notify_admin_new_deposit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount_egp TEXT;
  v_amount_usd TEXT;
  v_sender_phone TEXT;
  v_admin_id UUID;
BEGIN
  -- Amount is stored in USD, calculate EGP
  v_amount_usd := NEW.amount::NUMERIC(10,2)::TEXT;
  v_amount_egp := (NEW.amount * 50.0)::NUMERIC(10,2)::TEXT;
  v_sender_phone := COALESCE(NEW.sender_phone, 'غير محدد');
  
  -- Get first admin user
  SELECT id INTO v_admin_id 
  FROM users 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    -- Insert notification for admin
    INSERT INTO notifications (user_id, title, message, read)
    VALUES (
      v_admin_id,
      '💰 طلب إيداع جديد',
      'طلب إيداع بقيمة ' || v_amount_egp || ' جنيه' || E'\n' || 'يعادل ' || v_amount_usd || ' دولار' || E'\n' || 'رقم المرسل: ' || v_sender_phone,
      false
    );
    
    RAISE NOTICE 'Admin notification created for new deposit - Amount: % EGP', v_amount_egp;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on INSERT
DROP TRIGGER IF EXISTS on_deposit_request_notify_admin ON deposit_requests;
CREATE TRIGGER on_deposit_request_notify_admin
AFTER INSERT ON deposit_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_deposit();
