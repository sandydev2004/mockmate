import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";
import { z } from "zod";
import { verifyStepUpAuth, verifyTypedConfirmation } from "@/lib/step-up";
import { sendAdminAlert } from "@/lib/admin-alerts";

export const dynamic = "force-dynamic";

const changeRoleSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  newRole: z.enum(["user", "support", "admin", "super_admin"]),
  reason: z.string().min(5, "A justified reason (at least 5 characters) is required for role modification"),
  confirm: z.string().optional(),
});

export const PATCH = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const body = await req.json().catch(() => null);
    const validated = changeRoleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { targetUserId, newRole, reason, confirm } = validated.data;

    // 1. A user can NEVER change their own role
    if (adminUser.id === targetUserId) {
      return NextResponse.json(
        { error: "Self-escalation forbidden: You cannot modify your own administrative role." },
        { status: 400 }
      );
    }

    // 2. Fresh step-up authentication required
    if (!verifyStepUpAuth(req, adminUser.id)) {
      return NextResponse.json(
        { error: "Step-up authentication required for role changes", code: "STEP_UP_REQUIRED" },
        { status: 401 }
      );
    }

    // 3. Typed confirmation required
    const confirmPhrase = confirm || req.headers.get("x-confirm-action");
    if (!verifyTypedConfirmation(confirmPhrase, "CONFIRM_ROLE_CHANGE")) {
      return NextResponse.json(
        { error: "Typed confirmation required: Must supply confirm: 'CONFIRM_ROLE_CHANGE'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let targetProfile = appStore.getProfile(targetUserId);

    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();
      if (data) targetProfile = data;
    } catch {}

    const oldRole = targetProfile.role || "user";

    // 4. Prevent removing or demoting the last super_admin
    if (oldRole === "super_admin" && newRole !== "super_admin") {
      let superAdminCount = 0;
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin");
        if (!error && typeof count === "number") {
          superAdminCount = count;
        }
      } catch {}

      const memCount = appStore.getAllProfiles().filter((p) => p.role === "super_admin").length;
      const totalCount = superAdminCount > 0 ? superAdminCount : memCount;

      if (totalCount <= 1) {
        return NextResponse.json(
          { error: "Safety lock: Cannot demote the last super_admin on the platform." },
          { status: 400 }
        );
      }
    }

    // Update role
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", targetUserId);
    } catch {}
    appStore.updateProfile(targetUserId, { role: newRole });

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "user.role_changed",
      targetType: "user",
      targetId: targetUserId,
      details: {
        oldRole,
        newRole,
        reason,
      },
      req,
    });

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await sendAdminAlert({
      event: "role_changed",
      adminEmail: adminUser.email,
      ip: clientIp,
      details: {
        targetId: targetUserId,
        oldRole,
        newRole,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role successfully updated from ${oldRole} to ${newRole}`,
      newRole,
    });
  },
  { requiredPermission: "roles.manage" }
);
