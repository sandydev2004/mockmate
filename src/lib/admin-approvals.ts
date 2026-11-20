import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminApprovalRecord {
  id: string;
  requester_id: string;
  requester_email: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  payload: Record<string, any>;
  status: "pending" | "approved" | "rejected" | "expired";
  approver_id?: string | null;
  approver_email?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  expires_at: string;
}

// In-memory resilient store for approvals attached to globalThis across Next.js chunks
const globalForApprovals = globalThis as unknown as {
  adminApprovalsStore?: Map<string, AdminApprovalRecord>;
};
if (!globalForApprovals.adminApprovalsStore) {
  globalForApprovals.adminApprovalsStore = new Map<string, AdminApprovalRecord>();
}
const inMemoryApprovals = globalForApprovals.adminApprovalsStore;

export async function createApprovalRequest({
  requesterId,
  requesterEmail,
  action,
  targetType,
  targetId,
  payload,
}: {
  requesterId: string;
  requesterEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  payload: Record<string, any>;
}): Promise<AdminApprovalRecord> {
  const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const record: AdminApprovalRecord = {
    id,
    requester_id: requesterId,
    requester_email: requesterEmail,
    action,
    target_type: targetType,
    target_id: targetId || null,
    payload,
    status: "pending",
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  inMemoryApprovals.set(id, record);

  try {
    const supabase = createAdminClient();
    await supabase.from("admin_approvals").insert({
      id: record.id.startsWith("appr-") ? undefined : record.id,
      requester_id: requesterId,
      requester_email: requesterEmail,
      action,
      target_type: targetType,
      target_id: targetId || null,
      payload,
      status: "pending",
      expires_at: expiresAt,
    });
  } catch (err) {
    // In-memory fallback
  }

  return record;
}

export async function getApprovalRequest(id: string): Promise<AdminApprovalRecord | null> {
  const mem = inMemoryApprovals.get(id);
  if (mem) return mem;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("admin_approvals").select("*").eq("id", id).single();
    if (data) return data as AdminApprovalRecord;
  } catch {}

  return null;
}

export async function resolveApprovalRequest({
  id,
  approverId,
  approverEmail,
  verdict, // 'approved' | 'rejected'
  reason,
}: {
  id: string;
  approverId: string;
  approverEmail: string;
  verdict: "approved" | "rejected";
  reason?: string;
}): Promise<{ success: boolean; error?: string; record?: AdminApprovalRecord }> {
  const record = await getApprovalRequest(id);
  if (!record) {
    return { success: false, error: "Approval request not found" };
  }

  if (record.status !== "pending") {
    return { success: false, error: `Approval is already ${record.status}` };
  }

  // Dual-control enforcement: Approver CANNOT be the requester
  if (approverId === record.requester_id) {
    return { success: false, error: "Separation of duties violation: Requester cannot approve their own action." };
  }

  const now = new Date().toISOString();
  record.status = verdict;
  record.approver_id = approverId;
  record.approver_email = approverEmail;
  record.approved_at = now;
  if (reason) record.rejection_reason = reason;

  inMemoryApprovals.set(id, record);

  try {
    const supabase = createAdminClient();
    await supabase
      .from("admin_approvals")
      .update({
        status: verdict,
        approver_id: approverId,
        approver_email: approverEmail,
        approved_at: now,
        rejection_reason: reason || null,
      })
      .eq("id", id);
  } catch {}

  return { success: true, record };
}

export function getAllPendingApprovals(): AdminApprovalRecord[] {
  return Array.from(inMemoryApprovals.values()).filter((a) => a.status === "pending");
}
