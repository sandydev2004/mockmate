import { NextRequest } from "next/server";
import { ADMIN_CONFIG } from "./admin-config";

// In-memory step-up tokens: token -> { adminId, verifiedAt, expiresAt }
interface StepUpRecord {
  adminId: string;
  verifiedAt: number;
  expiresAt: number;
}

const globalForStepUp = globalThis as unknown as {
  adminStepUpStore?: Map<string, StepUpRecord>;
};
if (!globalForStepUp.adminStepUpStore) {
  globalForStepUp.adminStepUpStore = new Map<string, StepUpRecord>();
}
const stepUpStore = globalForStepUp.adminStepUpStore;

/**
 * Creates a valid step-up session for an admin after verifying fresh credentials (password or MFA).
 */
export function createStepUpToken(adminId: string): string {
  const token = `stepup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  stepUpStore.set(token, {
    adminId,
    verifiedAt: now,
    expiresAt: now + ADMIN_CONFIG.STEP_UP_VALIDITY_MS,
  });
  return token;
}

/**
 * Verifies that the admin has passed step-up re-authentication within the last 5 minutes.
 * Accepts:
 * - x-step-up-token header
 * - admin_step_up cookie
 * - x-test-step-up: "true" header in non-production test suites
 */
export function verifyStepUpAuth(req: NextRequest, adminId: string): boolean {
  if (process.env.NODE_ENV !== "production") {
    if (req.headers.get("x-test-step-up") === "true") {
      return true;
    }
    if (req.headers.get("x-test-step-up") === "false") {
      return false;
    }
  }

  const token =
    req.headers.get("x-step-up-token") ||
    req.cookies.get("admin_step_up")?.value;

  if (!token) {
    return false;
  }

  const record = stepUpStore.get(token);
  if (!record) {
    return false;
  }

  const now = Date.now();
  if (now > record.expiresAt || record.adminId !== adminId) {
    stepUpStore.delete(token);
    return false;
  }

  return true;
}

/**
 * Validates a typed confirmation phrase for destructive actions.
 */
export function verifyTypedConfirmation(
  receivedText: string | undefined | null,
  expectedPhrase: string = "CONFIRM"
): boolean {
  return receivedText?.trim().toUpperCase() === expectedPhrase.toUpperCase();
}
