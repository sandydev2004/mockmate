import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLogRecord } from "@/types";
import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { sendAdminAlert } from "@/lib/admin-alerts";

export interface LogAdminActionParams {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
  req?: NextRequest;
}

// In-memory fallback ring buffer attached to globalThis across Next.js chunks
const globalForAudit = globalThis as unknown as {
  adminAuditLogs?: AuditLogRecord[];
  adminLatestHash?: string;
};
if (!globalForAudit.adminAuditLogs) {
  globalForAudit.adminAuditLogs = [];
}
if (!globalForAudit.adminLatestHash) {
  globalForAudit.adminLatestHash = "GENESIS";
}
const inMemoryAuditLogs = globalForAudit.adminAuditLogs;
let latestHash = globalForAudit.adminLatestHash;

/**
 * Computes deterministic SHA-256 hash for audit chain verification.
 */
export function calculateAuditEntryHash(
  prevHash: string,
  id: string,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null | undefined,
  details: Record<string, any>,
  createdAt: string
): string {
  const content = [
    prevHash,
    id,
    adminId,
    action,
    targetType,
    targetId || "",
    JSON.stringify(details || {}),
    createdAt,
  ].join("::");

  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Strips secrets, passwords, tokens, API keys, resume text, and interview transcripts
 * from audit log payloads before recording.
 */
function sanitizeAuditDetails(raw: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    const keyLower = k.toLowerCase();
    if (
      keyLower.includes("password") ||
      keyLower.includes("secret") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("resume") ||
      keyLower.includes("transcript") ||
      keyLower.includes("starter_code")
    ) {
      sanitized[k] = "[REDACTED_SENSITIVE_CONTENT]";
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export async function logAdminAction({
  adminId,
  adminEmail,
  action,
  targetType,
  targetId,
  details = {},
  req,
}: LogAdminActionParams): Promise<AuditLogRecord> {
  const ip =
    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req?.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req?.headers.get("user-agent") || "unknown";
  const requestId =
    req?.headers.get("x-request-id") ||
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const safeDetails = sanitizeAuditDetails(details);
  const now = new Date().toISOString();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Compute hash chain
  const prevHash = inMemoryAuditLogs.length > 0 ? inMemoryAuditLogs[0].entry_hash || "GENESIS" : latestHash;
  const entryHash = calculateAuditEntryHash(
    prevHash,
    id,
    adminId,
    action,
    targetType,
    targetId,
    safeDetails,
    now
  );
  latestHash = entryHash;

  const entry: AuditLogRecord = {
    id,
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: safeDetails,
    ip_address: ip,
    user_agent: userAgent,
    request_id: requestId,
    prev_hash: prevHash,
    entry_hash: entryHash,
    created_at: now,
  };

  // Add to in-memory buffer (newest first)
  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 1000) {
    inMemoryAuditLogs.pop();
  }

  // Persist to Supabase audit_logs
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        admin_id: adminId,
        admin_email: adminEmail,
        action,
        target_type: targetType,
        target_id: targetId || null,
        details: safeDetails,
        ip_address: ip,
        user_agent: userAgent,
        request_id: requestId,
        prev_hash: prevHash,
        entry_hash: entryHash,
      })
      .select()
      .single();

    if (!error && data) {
      return data as AuditLogRecord;
    }
  } catch (err) {
    // In-memory fallback
  }

  return entry;
}

export function getInMemoryAuditLogs(): AuditLogRecord[] {
  return [...inMemoryAuditLogs];
}

/**
 * Super Admin function:
 * Verifies that the audit log hash chain has not been tampered with or modified.
 */
export async function verifyAuditLogIntegrity(): Promise<{
  valid: boolean;
  totalVerified: number;
  tamperedRowId?: string;
  error?: string;
}> {
  let logs: AuditLogRecord[] = [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      logs = data as AuditLogRecord[];
    } else {
      logs = [...inMemoryAuditLogs].reverse();
    }
  } catch {
    logs = [...inMemoryAuditLogs].reverse();
  }

  if (logs.length === 0) {
    return { valid: true, totalVerified: 0 };
  }

  let expectedPrevHash = "GENESIS";

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Check prev_hash pointer consistency
    if (log.prev_hash && log.prev_hash !== expectedPrevHash) {
      await sendAdminAlert({
        event: "audit_tampering_detected",
        adminEmail: "security-system@mockmate.internal",
        details: {
          tamperedRowId: log.id,
          expectedPrevHash,
          actualPrevHash: log.prev_hash,
        },
      });
      return {
        valid: false,
        totalVerified: i,
        tamperedRowId: log.id,
        error: `Broken chain pointer at log ID ${log.id}: expected prev_hash ${expectedPrevHash}, found ${log.prev_hash}`,
      };
    }

    // Recompute entry hash
    const calculatedHash = calculateAuditEntryHash(
      log.prev_hash || expectedPrevHash,
      log.id,
      log.admin_id,
      log.action,
      log.target_type,
      log.target_id,
      log.details || {},
      log.created_at
    );

    if (log.entry_hash && log.entry_hash !== calculatedHash) {
      await sendAdminAlert({
        event: "audit_tampering_detected",
        adminEmail: "security-system@mockmate.internal",
        details: {
          tamperedRowId: log.id,
          expectedEntryHash: calculatedHash,
          actualEntryHash: log.entry_hash,
        },
      });
      return {
        valid: false,
        totalVerified: i,
        tamperedRowId: log.id,
        error: `Tampered log contents detected at log ID ${log.id}: entry_hash mismatch.`,
      };
    }

    expectedPrevHash = log.entry_hash || calculatedHash;
  }

  return { valid: true, totalVerified: logs.length };
}

/**
 * Resets or modifies a log row in memory solely for test verification of integrity detection.
 */
export function simulateTamperAuditLog(targetId: string, alteredAction: string): void {
  const row = inMemoryAuditLogs.find((l) => l.id === targetId);
  if (row) {
    row.action = alteredAction; // Alter without updating hash -> tampering!
  }
}
