import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  // Only super_admin can run system diagnostics
  if (!isSuperAdmin(adminUser.role)) {
    return NextResponse.json(
      { error: "Access denied. Only Super Administrators can run system diagnostics.", code: "ADMIN_403" },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  // 1. Table and Column status checks
  const tables = [
    { name: "profiles", columns: "id, email, full_name, role, credits, is_suspended" },
    { name: "interviews", columns: "id, user_id, status, role, round, difficulty, overall_score" },
    { name: "payments", columns: "id, user_id, razorpay_order_id, amount, credits_added, status" },
    { name: "dsa_problems", columns: "id, title, slug, difficulty" },
    { name: "audit_logs", columns: "id, admin_id, admin_email, action" },
    { name: "platform_settings", columns: "key, value" },
    { name: "admin_approvals", columns: "id, requested_by, action_type, status" },
  ];

  const tableResults: Record<
    string,
    { status: "ok" | "error" | "missing"; rowCount: number; verifiedColumns: string; error?: string }
  > = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select(table.columns, { count: "exact", head: true });

      if (error) {
        tableResults[table.name] = {
          status: error.code === "42P01" ? "missing" : "error",
          rowCount: 0,
          verifiedColumns: table.columns,
          error: error.message,
        };
      } else {
        tableResults[table.name] = {
          status: "ok",
          rowCount: count || 0,
          verifiedColumns: table.columns,
        };
      }
    } catch (err: any) {
      tableResults[table.name] = {
        status: "error",
        rowCount: 0,
        verifiedColumns: table.columns,
        error: err.message,
      };
    }
  }

  // 2. Env variable check (NAMES ONLY - NEVER VALUES)
  const envKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "RAZORPAY_KEY_ID",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "GEMINI_API_KEY",
  ];

  const envResults = envKeys.map((name) => ({
    name,
    isSet: Boolean(process.env[name] && process.env[name]!.trim().length > 0),
  }));

  // 3. Supabase MFA handshake check
  let mfaStatus: { enabled: boolean; note: string } = {
    enabled: true,
    note: "Supabase client configured. TOTP is ready if enabled in dashboard.",
  };

  try {
    const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr) {
      mfaStatus = {
        enabled: false,
        note: aalErr.message,
      };
    }
  } catch (err: any) {
    mfaStatus = {
      enabled: false,
      note: err.message,
    };
  }

  // 4. Idempotent SQL remediation script
  const idempotentSql = `-- =========================================================
-- MOCKMATE PRODUCTION SCHEMA REPAIR SCRIPT (IDEMPOTENT)
-- Run this script in the Supabase SQL Editor if tables are missing
-- =========================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    credits INTEGER NOT NULL DEFAULT 1,
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    credits_added INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INTERVIEWS
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    role TEXT NOT NULL DEFAULT 'Full Stack Developer',
    difficulty TEXT NOT NULL DEFAULT 'medium',
    round TEXT NOT NULL DEFAULT 'technical',
    overall_score INTEGER,
    strikes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. DSA PROBLEMS
CREATE TABLE IF NOT EXISTS public.dsa_problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'Arrays',
    description TEXT NOT NULL,
    starter_code JSONB NOT NULL DEFAULT '{}'::jsonb,
    test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ADMIN APPROVALS
CREATE TABLE IF NOT EXISTS public.admin_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID NOT NULL,
    requester_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_id TEXT,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_by UUID,
    resolver_email TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

-- 8. IDEMPOTENT RLS POLICIES & COLUMNS
DO $$
BEGIN
    -- Ensure payments columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='credits_added') THEN
        ALTER TABLE public.payments ADD COLUMN credits_added INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='status') THEN
        ALTER TABLE public.payments ADD COLUMN status TEXT NOT NULL DEFAULT 'created';
    END IF;

    -- Ensure profiles columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_suspended') THEN
        ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Profiles Policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'support'))
    );

    -- Payments Policies
    DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
    CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
    CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'support'))
    );

    DROP POLICY IF EXISTS "Service role has full access to payments" ON public.payments;
    CREATE POLICY "Service role has full access to payments" ON public.payments FOR ALL USING (auth.jwt()->>'role' = 'service_role');
END $$;

-- 9. SAFE GOOGLE SIGN-UP TRIGGER (NON-BLOCKING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  candidate_name TEXT;
  existing_profile RECORD;
BEGIN
  candidate_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Check by email to preserve existing credits if signing in with Google
  SELECT * INTO existing_profile FROM public.profiles WHERE LOWER(email) = LOWER(NEW.email) LIMIT 1;
  IF existing_profile.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, credits, role)
    VALUES (NEW.id, LOWER(NEW.email), COALESCE(existing_profile.full_name, candidate_name), existing_profile.credits, COALESCE(existing_profile.role, 'user'))
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(TRIM(public.profiles.full_name), ''), EXCLUDED.full_name);
  ELSE
    INSERT INTO public.profiles (id, email, full_name, credits)
    VALUES (NEW.id, LOWER(NEW.email), candidate_name, 1)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(TRIM(public.profiles.full_name), ''), EXCLUDED.full_name);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user trigger warning: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    admin: {
      email: adminUser.email,
      role: adminUser.role,
    },
    tables: tableResults,
    envVars: envResults,
    mfa: mfaStatus,
    idempotentSql,
  });
});
