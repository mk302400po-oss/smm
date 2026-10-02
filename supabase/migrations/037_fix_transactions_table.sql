-- Fix transactions table - ensure amount column exists
-- This migration fixes the issue where transactions table exists but is missing the amount column

-- Drop and recreate the transactions table with correct structure
DROP TABLE IF EXISTS public.transactions CASCADE;

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'order', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id UUID,
  description TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON public.transactions(reference_id);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow service role to insert transactions
CREATE POLICY "Service role can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- Allow users to insert their own transactions (for deposit requests)
CREATE POLICY "Users can create their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- Grant permissions
GRANT SELECT ON public.transactions TO authenticated;
GRANT INSERT ON public.transactions TO service_role;
GRANT UPDATE ON public.transactions TO service_role;
