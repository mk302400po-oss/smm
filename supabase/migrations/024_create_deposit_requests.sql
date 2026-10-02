-- Create deposit_requests table for Flutter app
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_created_at ON public.deposit_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view own deposit requests"
    ON public.deposit_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposit requests"
    ON public.deposit_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for admin
CREATE POLICY "Admin can view all deposit requests"
    ON public.deposit_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update deposit requests"
    ON public.deposit_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_deposit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_deposit_requests_updated_at
    BEFORE UPDATE ON public.deposit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_deposit_requests_updated_at();
