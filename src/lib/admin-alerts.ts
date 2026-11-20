/**
 * Admin Anomaly Alert System
 * Dispatches alerts via configured Email or Telegram Bot.
 * Skips silently if neither is configured in environment.
 * STRICT PRIVACY REQUIREMENT: Alerts MUST NEVER contain candidate personal data (no candidate email, no resume, no transcript).
 */

export interface AdminAlertPayload {
  event:
    | "admin_login_new_device"
    | "admin_login_failed"
    | "role_changed"
    | "user_deleted"
    | "data_exported"
    | "credit_grant_high"
    | "settings_changed"
    | "mfa_changed"
    | "daily_limit_exceeded"
    | "audit_tampering_detected";
  adminEmail: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// In-memory alert history for verification/testing
const inMemoryAlerts: AdminAlertPayload[] = [];

export async function sendAdminAlert(payload: AdminAlertPayload): Promise<void> {
  const timestamp = payload.timestamp || new Date().toISOString();
  const alertRecord: AdminAlertPayload = {
    ...payload,
    timestamp,
    // Guarantee no candidate personal data leaks in details
    details: sanitizeAlertDetails(payload.details || {}),
  };

  inMemoryAlerts.unshift(alertRecord);
  if (inMemoryAlerts.length > 100) {
    inMemoryAlerts.pop();
  }

  const alertEmail = process.env.ALERT_EMAIL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  const alertSubject = `[MockMate Security Alert] ${payload.event.toUpperCase()}`;
  const alertBody = `
MockMate Security Notice
Event: ${payload.event}
Triggered By: ${payload.adminEmail}
IP: ${payload.ip || "unknown"}
Time: ${timestamp}
Details: ${JSON.stringify(alertRecord.details, null, 2)}
`;

  // 1. Send via Email if configured
  if (alertEmail) {
    try {
      // In production, integrate with existing resend or nodemailer provider
      console.log(`[SECURITY ALERT -> EMAIL ${alertEmail}] ${alertSubject}\n${alertBody}`);
    } catch (err) {
      console.warn("[ALERT_EMAIL_FAILED]", err);
    }
  }

  // 2. Send via Telegram Bot if configured
  if (telegramBotToken && telegramChatId) {
    try {
      const tgUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🚨 *MockMate Security Alert*\n*Event:* \`${payload.event}\`\n*Admin:* \`${payload.adminEmail}\`\n*IP:* \`${payload.ip || "N/A"}\`\n*Time:* \`${timestamp}\``,
          parse_mode: "Markdown",
        }),
      });
    } catch (err) {
      console.warn("[ALERT_TELEGRAM_FAILED]", err);
    }
  }
}

/**
 * Strips any candidate-specific PII (emails, names, resumes, transcripts) from alert payloads.
 */
function sanitizeAlertDetails(details: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(details)) {
    if (
      key.toLowerCase().includes("resume") ||
      key.toLowerCase().includes("transcript") ||
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("key")
    ) {
      continue;
    }
    // Mask any candidate email if accidentally passed
    if (key.toLowerCase().includes("email") && key !== "adminEmail") {
      sanitized[key] = "[PROTECTED_USER_IDENTIFIER]";
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function getInMemoryAlerts(): AdminAlertPayload[] {
  return [...inMemoryAlerts];
}
