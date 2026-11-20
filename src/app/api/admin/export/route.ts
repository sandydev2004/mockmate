import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { ADMIN_CONFIG } from "@/lib/admin-config";
import { verifyStepUpAuth } from "@/lib/step-up";
import { checkAndRecordDailyLimit } from "@/lib/admin-limits";
import { sendAdminAlert } from "@/lib/admin-alerts";

export const dynamic = "force-dynamic";

function escapeCSV(field: any): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    // 1. Fresh step-up authentication required
    if (!verifyStepUpAuth(req, adminUser.id)) {
      return NextResponse.json(
        { error: "Step-up authentication required for data export", code: "STEP_UP_REQUIRED" },
        { status: 401 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 2. Daily limit check
    const limitCheck = await checkAndRecordDailyLimit(
      adminUser.id,
      adminUser.email,
      "exports_run",
      1,
      clientIp
    );
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "users"; // users | interviews | payments

    const auditEntry = await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "data.exported_csv",
      targetType: "export",
      targetId: type,
      details: {
        type,
        maxCappedRows: ADMIN_CONFIG.MAX_EXPORT_ROWS,
      },
      req,
    });

    await sendAdminAlert({
      event: "data_exported",
      adminEmail: adminUser.email,
      ip: clientIp,
      details: { exportType: type, exportId: auditEntry.id },
    });

    const supabase = createAdminClient();
    const exportTime = new Date().toISOString();
    const watermarkHeaders = [
      `# MOCKMATE DATA EXPORT - CONFIDENTIAL`,
      `# Exported By: ${adminUser.email}`,
      `# Exported At: ${exportTime}`,
      `# Audit Ref: ${auditEntry.id}`,
      `# Row Limit: Capped at ${ADMIN_CONFIG.MAX_EXPORT_ROWS} rows`,
      `# ----------------------------------------`,
    ].join("\n");

    try {
      if (type === "users") {
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, credits, role, is_suspended, target_role, target_company_type, created_at")
          .order("created_at", { ascending: false })
          .limit(ADMIN_CONFIG.MAX_EXPORT_ROWS);

        if (error) throw error;

        const headers = ["ID", "Email", "Full Name", "Credits", "Role", "Is Suspended", "Target Role", "Company Type", "Created At"];
        const rows = (users || []).map((u) => [
          escapeCSV(u.id),
          escapeCSV(u.email),
          escapeCSV(u.full_name),
          escapeCSV(u.credits),
          escapeCSV(u.role || "user"),
          escapeCSV(u.is_suspended ? "true" : "false"),
          escapeCSV(u.target_role),
          escapeCSV(u.target_company_type),
          escapeCSV(u.created_at),
        ]);

        const csvContent = `${watermarkHeaders}\n${[headers.join(","), ...rows.map((r) => r.join(","))].join("\n")}`;
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="mockmate_users_${exportTime.split("T")[0]}.csv"`,
          },
        });
      }

      // Default empty export for other types
      return new NextResponse(`${watermarkHeaders}\nType not found`, { status: 400 });
    } catch {
      return new NextResponse(`${watermarkHeaders}\nExport failed`, { status: 500 });
    }
  },
  { requiredPermission: "export.run" }
);
