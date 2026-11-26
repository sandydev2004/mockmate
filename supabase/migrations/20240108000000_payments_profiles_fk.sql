-- Idempotent migration to ensure payments table schema, foreign key relationships, indexes, and RLS policies

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    credits_added INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist idempotently
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'razorpay_signature') THEN
        ALTER TABLE public.payments ADD COLUMN razorpay_signature TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'credits_added') THEN
        ALTER TABLE public.payments ADD COLUMN credits_added INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE public.payments ADD COLUMN status TEXT NOT NULL DEFAULT 'created';
    END IF;
END $$;

-- Foreign key relationship to profiles (for PostgREST schema cache relationship resolution if desired)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_user_id_profiles_fkey'
    ) THEN
        -- Only add if references exist in profiles table
        BEGIN
            ALTER TABLE public.payments
            ADD CONSTRAINT payments_user_id_profiles_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add foreign key constraint payments_user_id_profiles_fkey: %', SQLERRM;
        END;
    END IF;
END $$;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
    CREATE POLICY "Users can view their own payments"
        ON public.payments
        FOR SELECT
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
    CREATE POLICY "Admins can view all payments"
        ON public.payments
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'super_admin', 'support')
            )
        );

    DROP POLICY IF EXISTS "Service role has full access to payments" ON public.payments;
    CREATE POLICY "Service role has full access to payments"
        ON public.payments
        FOR ALL
        USING (auth.jwt()->>'role' = 'service_role');
END $$;
