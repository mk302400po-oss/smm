-- Add missing columns to orders table if they don't exist

-- Add total_price column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0;

-- Add provider_order_id column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_order_id TEXT;

-- Add start_count column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS start_count INTEGER DEFAULT 0;

-- Add current_count column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0;

-- Add index on provider_order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id ON orders(provider_order_id);

-- Update existing orders to have total_price if NULL
UPDATE public.orders o
SET total_price = (
  SELECT (o.quantity / 1000.0) * s.price_per_1000
  FROM services s
  WHERE s.id = o.service_id
)
WHERE o.total_price IS NULL OR o.total_price = 0;

-- Create transactions table if doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'order', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
