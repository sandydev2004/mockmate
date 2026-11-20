import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { resolveApprovalRequest } from "@/lib/admin-approvals";
import { verifyStepUpAuth } from "@/lib/step-up";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resolveSchema = z.object({
  verdict: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
});

export const POST = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const approvalId = segments[segments.length - 1];

    if (!approvalId) {
      return NextResponse.json({ error: "Approval ID is required" }, { status: 400 });
    }

    // Approving sensitive operations requires fresh step-up authentication
    if (!verifyStepUpAuth(req, adminUser.id)) {
      return NextResponse.json(
        { error: "Step-up authentication required to resolve approvals", code: "STEP_UP_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const validated = resolveSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { verdict, reason } = validated.data;

    const result = await resolveApprovalRequest({
      id: approvalId,
      approverId: adminUser.id,
      approverEmail: adminUser.email,
      verdict,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const approvalRecord = result.record!;

    // If approved, execute the held action
    if (verdict === "approved") {
      if (approvalRecord.action === "credits.grant_bulk") {
        const targetUserId = approvalRecord.target_id!;
        const amount = approvalRecord.payload.amount;
        const currentProfile = appStore.getProfile(targetUserId);
        const newCredits = (currentProfile.credits || 0) + amount;
        appStore.updateProfile(targetUserId, { credits: newCredits });

        await logAdminAction({
          adminId: adminUser.id,
          adminEmail: adminUser.email,
          action: "credits.granted_via_dual_approval",
          targetType: "user",
          targetId: targetUserId,
          details: {
            approvalId,
            requesterId: approvalRecord.requester_id,
            approverId: adminUser.id,
            amount,
          },
          req,
        });
      }
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: `approval.${verdict}`,
      targetType: "approval",
      targetId: approvalId,
      details: {
        verdict,
        reason,
        originalAction: approvalRecord.action,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      verdict,
      message: `Approval request ${approvalId} has been ${verdict}.`,
    });
  },
  { requiredPermission: "approvals.manage" }
);
