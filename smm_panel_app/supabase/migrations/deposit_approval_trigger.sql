-- Simple Deposit Approval Notification Trigger (FIXED)
-- This will work with EXISTING app (no rebuild needed)

-- Create function to send notification when deposit status changes to 'approved'
CREATE OR REPLACE FUNCTION notify_deposit_approval()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount_egp TEXT;
  v_amount_usd TEXT;
  v_sender_phone TEXT;
BEGIN
  -- Only trigger on approved status
  -- Handle both UPDATE (OLD exists) and INSERT (OLD is NULL)
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    
    -- Calculate amounts
    v_amount_egp := (NEW.amount * 50.0)::NUMERIC(10,2)::TEXT;
    v_amount_usd := NEW.amount::NUMERIC(10,2)::TEXT;
    v_sender_phone := COALESCE(NEW.sender_phone, 'غير محدد');
    
    -- Insert notification (will trigger Edge Function via on_notification_insert)
    INSERT INTO notifications (user_id, title, message, read)
    VALUES (
      NEW.user_id,
      'تمت موافقة على الإيداع ✅',
      'تمت إضافة ' || v_amount_egp || ' جنيه لرصيدك' || E'\n' || 'يعادل ' || v_amount_usd || ' دولار' || E'\n' || 'من رقم: ' || v_sender_phone,
      false
    );
    
    RAISE NOTICE 'Notification created for user % - Amount: % EGP', NEW.user_id, v_amount_egp;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_deposit_approved_notify ON deposit_requests;
CREATE TRIGGER on_deposit_approved_notify
AFTER UPDATE ON deposit_requests
FOR EACH ROW
EXECUTE FUNCTION notify_deposit_approval();
