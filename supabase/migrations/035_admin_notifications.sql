-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'order', 'cancellation')),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own notifications
CREATE POLICY "Admins can view own notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin' AND id = admin_id
        )
    );

-- Policy: Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update own notifications"
    ON public.admin_notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin' AND id = admin_id
        )
    );

-- Function to notify admins of new deposit requests
CREATE OR REPLACE FUNCTION notify_admins_new_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for all admins
    INSERT INTO public.admin_notifications (admin_id, title, body, type, reference_id)
    SELECT u.id, 
           'طلب إيداع جديد',
           'طلب إيداع بقيمة $' || NEW.amount::TEXT || ' من المستخدم',
           'deposit',
           NEW.id
    FROM public.users u
    WHERE u.role = 'admin';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new deposit requests
CREATE TRIGGER on_deposit_request_created
    AFTER INSERT ON public.deposit_requests
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_admins_new_deposit();

-- Function to notify admins of new orders
CREATE OR REPLACE FUNCTION notify_admins_new_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for all admins
    INSERT INTO public.admin_notifications (admin_id, title, body, type, reference_id)
    SELECT u.id,
           'طلب خدمة جديد',
           'طلب خدمة جديد بقيمة $' || NEW.total_price::TEXT,
           'order',
           NEW.id
    FROM public.users u
    WHERE u.role = 'admin';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new orders
CREATE TRIGGER on_order_created
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_new_order();
