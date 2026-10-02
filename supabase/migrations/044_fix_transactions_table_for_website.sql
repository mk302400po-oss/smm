-- Fix transactions table to support website deposits query
-- The website is trying to query: transactions with users(email)

-- 1. Check if transactions table exists, create if not
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'order', 'refund', 'adjustment')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add foreign key to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey'
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 4. Disable RLS (or set simple policies)
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

-- 6. Verify the fix
SELECT 
    'Transactions Table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

SELECT 
    'Foreign Key' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transactions_user_id_fkey'
            AND table_name = 'transactions'
        )
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;
