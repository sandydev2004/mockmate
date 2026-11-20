import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const POST = withAdminApi(async (adminUser, req: NextRequest) => {
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  try {
    await supabase
      .from("profiles")
      .update({ admin_session_revoked_at: now, updated_at: now })
      .eq("id", adminUser.id);
  } catch {}

  appStore.updateProfile(adminUser.id, { admin_session_revoked_at: now });

  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: "admin.signed_out_everywhere",
    targetType: "admin_session",
    targetId: adminUser.id,
    details: { revokedAt: now },
    req,
  });

  const res = NextResponse.json({
    success: true,
    message: "All administrative sessions have been terminated. Please re-login.",
  });

  // Clear local admin session cookies
  res.cookies.delete("admin_step_up");
  res.cookies.delete("sb-access-token");
  res.cookies.delete("sb-refresh-token");

  return res;
});
