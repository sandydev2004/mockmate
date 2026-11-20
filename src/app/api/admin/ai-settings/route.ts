import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { getLLMTelemetry } from "@/lib/llm";
import { getPlatformSettings, updatePlatformSetting } from "@/lib/platform-settings";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";
import { verifyStepUpAuth } from "@/lib/step-up";
import { sendAdminAlert } from "@/lib/admin-alerts";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    try {
      const telemetry = getLLMTelemetry();
      const platformSettings = await getPlatformSettings();

      return NextResponse.json({
        telemetry,
        platformSettings,
      });
    } catch (err: any) {
      console.error("[ADMIN_AI_SETTINGS_ERROR]", err);
      return NextResponse.json({ error: "Failed to load AI settings", details: err.message }, { status: 500 });
    }
  },
  { requiredPermission: "settings.view" }
);

const updateSettingSchema = z.object({
  key: z.enum([
    "llm_kill_switch",
    "max_daily_interviews_per_user",
    "max_strikes",
    "strike_grace_seconds",
  ]),
  value: z.union([z.boolean(), z.number()]),
});

export const POST = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const body = await req.json().catch(() => null);
    const validated = updateSettingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { key, value } = validated.data;

    // Modifying the global kill-switch requires fresh step-up authentication
    if (key === "llm_kill_switch") {
      if (!verifyStepUpAuth(req, adminUser.id)) {
        return NextResponse.json(
          { error: "Step-up authentication required to toggle global kill-switch", code: "STEP_UP_REQUIRED" },
          { status: 401 }
        );
      }
    }

    const oldSettings = await getPlatformSettings();
    const oldValue = oldSettings[key];

    const success = await updatePlatformSetting(key, value as any, adminUser.id);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist setting" }, { status: 500 });
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "platform_setting.updated",
      targetType: "setting",
      targetId: key,
      details: {
        key,
        oldValue,
        newValue: value,
      },
      req,
    });

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await sendAdminAlert({
      event: "settings_changed",
      adminEmail: adminUser.email,
      ip: clientIp,
      details: { key, oldValue, newValue: value },
    });

    return NextResponse.json({
      success: true,
      message: `Setting ${key} updated successfully`,
      key,
      value,
    });
  },
  { requiredPermission: "settings.edit" }
);
