import { CurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appStore } from "@/lib/store";
import { isAdminRole } from "@/lib/admin-permissions";

export interface CreditEligibilityResult {
  eligible: boolean;
  isAdmin: boolean;
  credits: number;
  error?: string;
  statusCode?: number;
}

export interface CreditConsumptionResult {
  success: boolean;
  deducted: boolean;
  remainingCredits: number;
}

/**
 * Returns true if the user is an administrator and therefore exempt from all credit checks and deductions.
 */
export function canUseWithoutCredits(user: CurrentUser | null | undefined): boolean {
  return isAdminRole(user?.role);
}

/**
 * Server-side credit eligibility check:
 * 1. Checks if the user is an admin (exempt from credits).
 * 2. Checks if account is suspended (strictly blocks with 403).
 * 3. Verifies normal candidates have >= 1 available credit.
 */
export async function verifyCreditEligibility(
  user: CurrentUser
): Promise<CreditEligibilityResult> {
  const supabase = createAdminClient();

  // Load fresh profile from database to ensure client cannot spoof role/credits
  let dbProfile: any = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits, role, is_suspended")
      .eq("id", user.id)
      .single();
    if (!error && data) {
      dbProfile = data;
    }
  } catch {}

  if (!dbProfile) {
    dbProfile = appStore.getProfile(user.id);
  }

  // Account suspension check
  if (dbProfile?.is_suspended || user.is_suspended) {
    return {
      eligible: false,
      isAdmin: false,
      credits: dbProfile?.credits ?? 0,
      error: "Your account has been suspended. Please contact support.",
      statusCode: 403,
    };
  }

  // Admin credit exemption (support, admin & super_admin)
  const isServerVerifiedAdmin = isAdminRole(dbProfile?.role) || isAdminRole(user.role);
  if (isServerVerifiedAdmin) {
    return {
      eligible: true,
      isAdmin: true,
      credits: Infinity,
    };
  }

  // Normal user credit check
  const availableCredits = typeof user.credits === "number" ? user.credits : (dbProfile?.credits ?? 0);
  if (availableCredits < 1) {
    return {
      eligible: false,
      isAdmin: false,
      credits: availableCredits,
      error: "Insufficient credits. You need at least 1 credit to start an interview.",
      statusCode: 402,
    };
  }

  return {
    eligible: true,
    isAdmin: false,
    credits: availableCredits,
  };
}

/**
 * Consumes a credit for paid features (interviews, etc.):
 * - If user is an admin: SKIPS credit deduction entirely (deducted: false).
 * - If user is a normal candidate: Deducts 1 credit atomically.
 */
export async function consumeCredit(
  user: CurrentUser,
  options?: { interviewId?: string }
): Promise<CreditConsumptionResult> {
  // If user is admin, skip credit deduction completely
  if (canUseWithoutCredits(user)) {
    return {
      success: true,
      deducted: false,
      remainingCredits: Infinity,
    };
  }

  const supabase = createAdminClient();

  // Double check server-side DB role
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      return {
        success: true,
        deducted: false,
        remainingCredits: Infinity,
      };
    }
  } catch {}

  // Deduct 1 credit for normal user
  let deducted = false;
  let remaining = 0;

  try {
    const { data: rpcDeducted, error: rpcErr } = await supabase.rpc(
      "deduct_interview_credit",
      { p_user_id: user.id }
    );

    if (!rpcErr && rpcDeducted) {
      deducted = true;
    } else {
      // Fallback deduction using server service role
      const localProfile = appStore.getProfile(user.id);
      const newCredits = Math.max(0, (localProfile.credits || 1) - 1);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (!updateErr) {
        deducted = true;
        remaining = newCredits;
      }
    }
  } catch {}

  if (!deducted) {
    deducted = appStore.deductCredit(user.id);
    remaining = appStore.getProfile(user.id).credits;
  }

  return {
    success: deducted,
    deducted,
    remainingCredits: remaining,
  };
}
