import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { verifyAuditLogIntegrity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const report = await verifyAuditLogIntegrity();

    return NextResponse.json({
      verified: report.valid,
      totalEntriesChecked: report.totalVerified,
      tamperedRowId: report.tamperedRowId || null,
      error: report.error || null,
      timestamp: new Date().toISOString(),
    });
  },
  { requiredPermission: "audit.verify" }
);
