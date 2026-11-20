import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { getAllPendingApprovals } from "@/lib/admin-approvals";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const approvals = getAllPendingApprovals();
    return NextResponse.json({
      approvals,
      count: approvals.length,
    });
  },
  { requiredPermission: "approvals.manage" }
);
