import { NextRequest, NextResponse } from "next/server";
import { withAdminApi, maskEmail } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";
import { z } from "zod";
import { ADMIN_CONFIG } from "@/lib/admin-config";
import { verifyStepUpAuth, verifyTypedConfirmation } from "@/lib/step-up";
import { createApprovalRequest } from "@/lib/admin-approvals";
import { checkAndRecordDailyLimit } from "@/lib/admin-limits";
import { sendAdminAlert } from "@/lib/admin-alerts";
import { hasPermission } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const userId = segments[segments.length - 1];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      let targetProfile = profile;
      if (profileErr || !targetProfile) {
        targetProfile = appStore.getProfile(userId);
      }

      // Fetch user's interviews
      const { data: interviews } = await supabase
        .from("interviews")
        .select("id, role, company_type, difficulty, round, status, mode, strikes, auto_submit_reason, overall_score, started_at, ended_at")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(50);

      // Mask email by default unless requested with reveal
      const safeProfile = {
        ...targetProfile,
        email: maskEmail(targetProfile.email),
        unmasked: false,
      };

      return NextResponse.json({
        profile: safeProfile,
        interviews: interviews || appStore.getUserInterviews(userId),
        resumes: appStore.getUserResumes(userId).map((r) => ({
          id: r.id,
          filename: r.filename,
          created_at: r.created_at,
          // Resume text masked by default
          extracted_text: "[PROTECTED: Reveal required with logged reason]",
        })),
      });
    } catch {
      const fallback = appStore.getProfile(userId);
      return NextResponse.json({
        profile: {
          ...fallback,
          email: maskEmail(fallback.email),
          unmasked: false,
        },
        interviews: appStore.getUserInterviews(userId),
        resumes: [],
      });
    }
  },
  { requiredPermission: "users.view" }
);

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("adjust_credits"),
    amount: z.number().int().refine((val) => val !== 0, "Amount cannot be 0"),
    reason: z.string().min(3, "A detailed reason (at least 3 characters) is required for credit adjustments"),
    confirm: z.string().optional(),
  }),
  z.object({
    action: z.literal("toggle_suspend"),
    is_suspended: z.boolean(),
    reason: z.string().min(3, "A detailed reason is required for suspension changes"),
  }),
  z.object({
    action: z.literal("restore"),
    reason: z.string().optional().default("Restored by admin"),
  }),
]);

export const PATCH = withAdminApi(async (adminUser, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const userId = segments[segments.length - 1];

  const body = await req.json().catch(() => null);
  const validated = patchSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.format() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let currentProfile = appStore.getProfile(userId);

  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) currentProfile = data;
  } catch {}

  const payload = validated.data;
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // 1. ACTION: ADJUST CREDITS
  if (payload.action === "adjust_credits") {
    // Least privilege check for support role
    if (adminUser.role === "support") {
      if (Math.abs(payload.amount) > ADMIN_CONFIG.SMALL_CREDIT_THRESHOLD) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: `Support role is limited to adjusting at most ${ADMIN_CONFIG.SMALL_CREDIT_THRESHOLD} credits at a time. Please escalate to an admin.`,
          },
          { status: 403 }
        );
      }
    }

    // Step-up auth required for credit grants >= 20
    if (Math.abs(payload.amount) >= 20) {
      if (!verifyStepUpAuth(req, adminUser.id)) {
        return NextResponse.json(
          { error: "Step-up authentication required", code: "STEP_UP_REQUIRED" },
          { status: 401 }
        );
      }
    }

    // Dual approval required for large credit grants (> 50 credits)
    if (payload.amount > ADMIN_CONFIG.DUAL_APPROVAL_CREDIT_THRESHOLD) {
      const approval = await createApprovalRequest({
        requesterId: adminUser.id,
        requesterEmail: adminUser.email,
        action: "credits.grant_bulk",
        targetType: "user",
        targetId: userId,
        payload: {
          targetEmail: currentProfile.email,
          amount: payload.amount,
          reason: payload.reason,
        },
      });

      await logAdminAction({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: "approval.created",
        targetType: "approval",
        targetId: approval.id,
        details: { action: "credits.grant_bulk", amount: payload.amount },
        req,
      });

      return NextResponse.json({
        pending_approval: true,
        approval_id: approval.id,
        message: `Granting ${payload.amount} credits exceeds threshold (${ADMIN_CONFIG.DUAL_APPROVAL_CREDIT_THRESHOLD}) and requires a second super_admin to approve.`,
      });
    }

    // Check per-admin daily limit
    if (payload.amount > 0) {
      const limitCheck = await checkAndRecordDailyLimit(
        adminUser.id,
        adminUser.email,
        "credits_granted",
        payload.amount,
        clientIp
      );
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.error }, { status: 429 });
      }
    }

    const newCredits = Math.max(0, (currentProfile.credits || 0) + payload.amount);

    try {
      await supabase
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch {}
    appStore.updateProfile(userId, { credits: newCredits });

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: payload.amount > 0 ? "user.credits.added" : "user.credits.deducted",
      targetType: "user",
      targetId: userId,
      details: {
        previousCredits: currentProfile.credits,
        newCredits,
        delta: payload.amount,
        reason: payload.reason,
      },
      req,
    });

    if (payload.amount >= 20) {
      await sendAdminAlert({
        event: "credit_grant_high",
        adminEmail: adminUser.email,
        ip: clientIp,
        details: { amount: payload.amount, targetId: userId },
      });
    }

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `Successfully adjusted credits by ${payload.amount > 0 ? `+${payload.amount}` : payload.amount}`,
    });
  }

  // 2. ACTION: TOGGLE SUSPENSION
  if (payload.action === "toggle_suspend") {
    if (!hasPermission(adminUser.role, "users.suspend")) {
      return NextResponse.json(
        { error: "Forbidden", message: `Your role (${adminUser.role}) cannot suspend users` },
        { status: 403 }
      );
    }

    try {
      await supabase
        .from("profiles")
        .update({ is_suspended: payload.is_suspended, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch {}
    appStore.updateProfile(userId, { is_suspended: payload.is_suspended });

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: payload.is_suspended ? "user.suspended" : "user.unsuspended",
      targetType: "user",
      targetId: userId,
      details: {
        previousSuspended: currentProfile.is_suspended,
        newSuspended: payload.is_suspended,
        reason: payload.reason,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      is_suspended: payload.is_suspended,
      message: `User ${payload.is_suspended ? "suspended" : "unsuspended"} successfully`,
    });
  }

  // 3. ACTION: RESTORE SOFT-DELETED USER
  if (payload.action === "restore") {
    if (!hasPermission(adminUser.role, "users.restore")) {
      return NextResponse.json(
        { error: "Forbidden", message: `Your role (${adminUser.role}) cannot restore users` },
        { status: 403 }
      );
    }

    if (!currentProfile.is_deleted) {
      return NextResponse.json({ error: "User is not in deleted state" }, { status: 400 });
    }

    // Check grace period (14 days)
    if (currentProfile.deleted_at) {
      const deletedTime = new Date(currentProfile.deleted_at).getTime();
      const elapsedDays = (Date.now() - deletedTime) / (1000 * 60 * 60 * 24);
      if (elapsedDays > ADMIN_CONFIG.SOFT_DELETE_GRACE_PERIOD_DAYS) {
        return NextResponse.json(
          { error: "Grace period expired: User has passed the 14-day restoration window." },
          { status: 410 }
        );
      }
    }

    try {
      await supabase
        .from("profiles")
        .update({ is_deleted: false, is_suspended: false, deleted_at: null, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch {}
    appStore.updateProfile(userId, {
      is_deleted: false,
      is_suspended: false,
      deleted_at: null,
    });

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "user.restored",
      targetType: "user",
      targetId: userId,
      details: { reason: payload.reason },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "User account restored successfully within grace period",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});

export const DELETE = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const userId = segments[segments.length - 1];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === adminUser.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    // Step-up auth verification
    if (!verifyStepUpAuth(req, adminUser.id)) {
      return NextResponse.json(
        { error: "Step-up authentication required for user deletion", code: "STEP_UP_REQUIRED" },
        { status: 401 }
      );
    }

    // Typed confirmation check
    const body = await req.json().catch(() => ({}));
    const confirmPhrase = body.confirm || req.headers.get("x-confirm-action");
    if (!verifyTypedConfirmation(confirmPhrase, "CONFIRM_DELETE")) {
      return NextResponse.json(
        { error: "Typed confirmation required: Must supply confirm: 'CONFIRM_DELETE'" },
        { status: 400 }
      );
    }

    // Daily limit check
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const limitCheck = await checkAndRecordDailyLimit(
      adminUser.id,
      adminUser.email,
      "users_deleted",
      1,
      clientIp
    );
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Soft delete: Account is disabled immediately, permanent purge after 14 days
    try {
      await supabase
        .from("profiles")
        .update({
          is_deleted: true,
          is_suspended: true,
          deleted_at: now,
          updated_at: now,
        })
        .eq("id", userId);
    } catch {}
    appStore.updateProfile(userId, {
      is_deleted: true,
      is_suspended: true,
      deleted_at: now,
    });

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "user.soft_deleted",
      targetType: "user",
      targetId: userId,
      details: {
        gracePeriodDays: ADMIN_CONFIG.SOFT_DELETE_GRACE_PERIOD_DAYS,
        deletedAt: now,
      },
      req,
    });

    await sendAdminAlert({
      event: "user_deleted",
      adminEmail: adminUser.email,
      ip: clientIp,
      details: { targetId: userId, softDeleted: true },
    });

    return NextResponse.json({
      success: true,
      message: `User account disabled immediately (soft-deleted). Eligible for restoration for ${ADMIN_CONFIG.SOFT_DELETE_GRACE_PERIOD_DAYS} days.`,
      deleted_at: now,
    });
  },
  { requiredPermission: "users.delete" }
);
