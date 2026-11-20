import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const revealSchema = z.object({
  reason: z.string().min(5, "A justified reason (at least 5 characters) is required to view candidate sensitive data"),
  dataType: z.enum(["email", "resume", "transcript", "all"]),
});

export const POST = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    // URL pattern: /api/admin/users/[id]/reveal
    const userId = segments[segments.length - 2];

    const body = await req.json().catch(() => null);
    const validated = revealSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { reason, dataType } = validated.data;
    const supabase = createAdminClient();

    let profile: any = null;
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) profile = data;
    } catch {}

    if (!profile) {
      profile = appStore.getProfile(userId);
    }

    // Strictly log sensitive access in tamper-proof audit log
    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "candidate.sensitive_data_revealed",
      targetType: "user",
      targetId: userId,
      details: {
        dataType,
        justificationReason: reason,
      },
      req,
    });

    const resumes = appStore.getUserResumes(userId);

    return NextResponse.json({
      success: true,
      revealed: true,
      email: profile.email,
      full_name: profile.full_name,
      resumes: resumes.map((r) => ({
        id: r.id,
        filename: r.filename,
        extracted_text: r.extracted_text,
      })),
    });
  },
  { requiredPermission: "users.view_sensitive" }
);
