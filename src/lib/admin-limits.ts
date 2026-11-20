import { ADMIN_CONFIG } from "@/lib/admin-config";
import { sendAdminAlert } from "@/lib/admin-alerts";

interface DailyUsageRecord {
  creditsGranted: number;
  usersDeleted: number;
  exportsRun: number;
  dateStr: string;
}

// In-memory daily usage tracking attached to globalThis across Next.js chunks
const globalForLimits = globalThis as unknown as {
  adminDailyUsageStore?: Map<string, DailyUsageRecord>;
};
if (!globalForLimits.adminDailyUsageStore) {
  globalForLimits.adminDailyUsageStore = new Map<string, DailyUsageRecord>();
}
const dailyUsage = globalForLimits.adminDailyUsageStore;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getUsageRecord(adminId: string): DailyUsageRecord {
  const today = getTodayString();
  const existing = dailyUsage.get(adminId);
  if (!existing || existing.dateStr !== today) {
    const newRecord: DailyUsageRecord = {
      creditsGranted: 0,
      usersDeleted: 0,
      exportsRun: 0,
      dateStr: today,
    };
    dailyUsage.set(adminId, newRecord);
    return newRecord;
  }
  return existing;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  error?: string;
}

/**
 * Checks and records administrative daily usage limits.
 * If exceeded, blocks the action and immediately triggers an anomaly security alert.
 */
export async function checkAndRecordDailyLimit(
  adminId: string,
  adminEmail: string,
  actionType: "credits_granted" | "users_deleted" | "exports_run",
  amount: number = 1,
  ip?: string
): Promise<LimitCheckResult> {
  const usage = getUsageRecord(adminId);

  if (actionType === "credits_granted") {
    const newTotal = usage.creditsGranted + amount;
    if (newTotal > ADMIN_CONFIG.DAILY_LIMIT_CREDITS_GRANTED) {
      await sendAdminAlert({
        event: "daily_limit_exceeded",
        adminEmail,
        ip,
        details: {
          limitType: "credits_granted",
          attempted: amount,
          current: usage.creditsGranted,
          limit: ADMIN_CONFIG.DAILY_LIMIT_CREDITS_GRANTED,
        },
      });
      return {
        allowed: false,
        current: usage.creditsGranted,
        limit: ADMIN_CONFIG.DAILY_LIMIT_CREDITS_GRANTED,
        error: `Daily limit exceeded: Admin can grant at most ${ADMIN_CONFIG.DAILY_LIMIT_CREDITS_GRANTED} credits per day. (Used: ${usage.creditsGranted})`,
      };
    }
    usage.creditsGranted = newTotal;
    return { allowed: true, current: newTotal, limit: ADMIN_CONFIG.DAILY_LIMIT_CREDITS_GRANTED };
  }

  if (actionType === "users_deleted") {
    const newTotal = usage.usersDeleted + amount;
    if (newTotal > ADMIN_CONFIG.DAILY_LIMIT_USERS_DELETED) {
      await sendAdminAlert({
        event: "daily_limit_exceeded",
        adminEmail,
        ip,
        details: {
          limitType: "users_deleted",
          attempted: amount,
          current: usage.usersDeleted,
          limit: ADMIN_CONFIG.DAILY_LIMIT_USERS_DELETED,
        },
      });
      return {
        allowed: false,
        current: usage.usersDeleted,
        limit: ADMIN_CONFIG.DAILY_LIMIT_USERS_DELETED,
        error: `Daily limit exceeded: Admin can delete at most ${ADMIN_CONFIG.DAILY_LIMIT_USERS_DELETED} users per day. (Used: ${usage.usersDeleted})`,
      };
    }
    usage.usersDeleted = newTotal;
    return { allowed: true, current: newTotal, limit: ADMIN_CONFIG.DAILY_LIMIT_USERS_DELETED };
  }

  if (actionType === "exports_run") {
    const newTotal = usage.exportsRun + amount;
    if (newTotal > ADMIN_CONFIG.DAILY_LIMIT_EXPORTS) {
      await sendAdminAlert({
        event: "daily_limit_exceeded",
        adminEmail,
        ip,
        details: {
          limitType: "exports_run",
          attempted: amount,
          current: usage.exportsRun,
          limit: ADMIN_CONFIG.DAILY_LIMIT_EXPORTS,
        },
      });
      return {
        allowed: false,
        current: usage.exportsRun,
        limit: ADMIN_CONFIG.DAILY_LIMIT_EXPORTS,
        error: `Daily limit exceeded: Admin can export data at most ${ADMIN_CONFIG.DAILY_LIMIT_EXPORTS} times per day. (Used: ${usage.exportsRun})`,
      };
    }
    usage.exportsRun = newTotal;
    return { allowed: true, current: newTotal, limit: ADMIN_CONFIG.DAILY_LIMIT_EXPORTS };
  }

  return { allowed: true, current: 0, limit: 0 };
}
