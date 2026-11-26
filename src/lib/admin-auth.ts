import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  AdminPermission,
  AdminRole,
  hasPermission,
  isAdminRole,
} from "@/lib/admin-permissions";
import { ADMIN_CONFIG } from "@/lib/admin-config";

// In-memory rate limiting and lockout tracking
interface LockoutRecord {
  failures: number;
  lockedUntil: number;
}

const failureStore = new Map<string, LockoutRecord>();
const adminRateLimits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Server-only logger for administrative authorization denials.
 * Never leaks denial reasons to clients; prints full debugging context to server console.
 */
export function logAdminDenial(
  reason: string,
  details?: {
    path?: string;
    ip?: string;
    userId?: string;
    email?: string;
    role?: string;
    aal?: string | null;
    error?: any;
  }
) {
  const parts = [
    `[ADMIN_ACCESS_DENIED]`,
    `Reason: ${reason}`,
    details?.path ? `Path: ${details.path}` : null,
    details?.ip ? `IP: ${details.ip}` : null,
    details?.email
      ? `User: ${details.email} (ID: ${details.userId})`
      : details?.userId
      ? `User ID: ${details.userId}`
      : "User: Anonymous / No Session",
    details?.role ? `Role: ${details.role}` : null,
    details?.aal ? `AAL: ${details.aal}` : null,
    details?.error ? `Error: ${details.error?.message || details.error}` : null,
  ].filter(Boolean);

  console.warn(parts.join(" | "));
}

/**
 * Checks temporary lockout after repeated failures (5 failures = 15m lockout).
 */
export function isLockedOut(identifier: string): boolean {
  const rec = failureStore.get(identifier);
  if (!rec) return false;
  if (Date.now() > rec.lockedUntil) {
    failureStore.delete(identifier);
    return false;
  }
  return rec.failures >= ADMIN_CONFIG.FAILED_ATTEMPTS_BEFORE_LOCKOUT;
}

export function recordFailure(identifier: string): void {
  const now = Date.now();
  const rec = failureStore.get(identifier) || { failures: 0, lockedUntil: 0 };
  rec.failures += 1;
  if (rec.failures >= ADMIN_CONFIG.FAILED_ATTEMPTS_BEFORE_LOCKOUT) {
    rec.lockedUntil = now + ADMIN_CONFIG.LOCKOUT_DURATION_MS;
  }
  failureStore.set(identifier, rec);
}

export function clearFailures(identifier: string): void {
  failureStore.delete(identifier);
}

/**
 * Per-IP request limiter for administrative endpoints.
 */
function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = adminRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    adminRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= 120) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Validates IP against ADMIN_ALLOWED_IPS (if configured) with recovery token bypass.
 */
function isIpAllowed(ip: string, req: NextRequest): boolean {
  const allowed = process.env.ADMIN_ALLOWED_IPS;
  if (!allowed || !allowed.trim()) {
    return true; // No allowlist restriction configured
  }

  // Super admin recovery bypass via secret token
  const recoveryToken = req.headers.get("x-admin-recovery-token");
  if (recoveryToken && recoveryToken === process.env.ADMIN_RECOVERY_KEY) {
    return true;
  }

  const list = allowed.split(",").map((s) => s.trim().toLowerCase());
  return list.includes(ip.toLowerCase()) || list.includes("127.0.0.1") || list.includes("::1");
}

/**
 * Strict Origin / CSRF validation for state-changing HTTP methods.
 */
function verifyOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) {
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const hostHeader = req.headers.get("host") || "";
    return originUrl.host === hostHeader || origin.includes(hostHeader);
  } catch {
    return false;
  }
}

/**
 * Applies security hardening headers to all admin responses.
 */
export function applyAdminSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
  );
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

/**
 * Masks candidate personal data by default (e.g. s***p@gmail.com).
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "masked@user";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export interface VerifyAdminResult {
  user: CurrentUser | null;
  needsMfaEnrollment?: boolean;
}

export type VerifyAdminApiResult =
  | { success: true; user: CurrentUser; needsMfa: false }
  | { success: false; needsMfa: true; user: CurrentUser }
  | { success: false; needsMfa: false; user: null };

/**
 * Server-side helper for API routes:
 * Strictly verifies role (support, admin, super_admin), active status, IP allowlist, MFA/AAL2 status, and lockout.
 * Returns structured result indicating success, MFA requirement, or denial.
 * Logs exact failure reason on the server console only.
 */
export async function verifyAdminApiDetailed(req: NextRequest): Promise<VerifyAdminApiResult> {
  const ip = getClientIp(req);
  const path = req.nextUrl?.pathname || req.url;

  // 1. IP allowlist check
  if (!isIpAllowed(ip, req)) {
    logAdminDenial("IP not in allowed list (ADMIN_ALLOWED_IPS)", { ip, path });
    return { success: false, needsMfa: false, user: null };
  }

  // 2. Lockout check
  if (isLockedOut(ip)) {
    logAdminDenial("IP temporarily locked out after repeated failed attempts", { ip, path });
    return { success: false, needsMfa: false, user: null };
  }

  // 3. Rate limit check
  if (!checkAdminRateLimit(ip)) {
    logAdminDenial("Rate limit exceeded for IP", { ip, path });
    return { success: false, needsMfa: false, user: null };
  }

  // 4. CSRF / Origin check
  if (!verifyOrigin(req)) {
    logAdminDenial("CSRF origin/host check failed", { ip, path });
    return { success: false, needsMfa: false, user: null };
  }

  // 5. Test header simulation for non-production environments
  if (process.env.NODE_ENV !== "production" && req.headers.get("x-test-auth-role")) {
    const role = req.headers.get("x-test-auth-role") as any;
    const isSuspended = req.headers.get("x-test-auth-suspended") === "true";
    const mfaEnrolled = req.headers.get("x-test-auth-mfa-enrolled") !== "false";
    const aal = req.headers.get("x-test-auth-aal") || "aal2";

    if (!isAdminRole(role)) {
      logAdminDenial(`Test header role '${role}' is not an admin role`, { ip, path, role });
      return { success: false, needsMfa: false, user: null };
    }

    if (isSuspended) {
      logAdminDenial("Test user is suspended", { ip, path, role });
      return { success: false, needsMfa: false, user: null };
    }

    const testUser: CurrentUser = {
      id: req.headers.get("x-test-auth-id") || "admin-system-user-01",
      email: req.headers.get("x-test-auth-email") || "operations@mockmate.internal",
      full_name: "MockMate System Admin",
      credits: 10,
      role,
      is_suspended: false,
    };

    if (!mfaEnrolled || aal !== "aal2") {
      logAdminDenial(`Test user session not AAL2 (enrolled: ${mfaEnrolled}, aal: ${aal})`, { ip, path, role, aal });
      return { success: false, needsMfa: true, user: testUser };
    }

    return { success: true, user: testUser, needsMfa: false };
  }

  // 6. Live Supabase Session & Role validation (using getUser() server-side)
  const user = await getCurrentUser();
  if (!user) {
    logAdminDenial("No active Supabase session / unauthenticated request", { ip, path });
    return { success: false, needsMfa: false, user: null };
  }

  if (user.is_suspended) {
    logAdminDenial("Admin account is suspended", { ip, path, userId: user.id, email: user.email, role: user.role });
    return { success: false, needsMfa: false, user: null };
  }

  if (!isAdminRole(user.role)) {
    logAdminDenial(`User role '${user.role}' is not authorized to access admin endpoints`, {
      ip,
      path,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return { success: false, needsMfa: false, user: null };
  }

  // 7. Verify MFA (Supabase TOTP) & Assurance Level (AAL2)
  try {
    const supabase = await createClient();
    const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr) {
      logAdminDenial("Failed to query authenticator assurance level from Supabase MFA", {
        ip,
        path,
        userId: user.id,
        email: user.email,
        role: user.role,
        error: aalErr,
      });
      return { success: false, needsMfa: true, user };
    }

    if (aalData?.currentLevel !== "aal2") {
      logAdminDenial(
        `Admin session is at level '${aalData?.currentLevel || "aal1"}' - AAL2 required (nextLevel: ${aalData?.nextLevel}). Admin must complete MFA enrollment/verification.`,
        {
          ip,
          path,
          userId: user.id,
          email: user.email,
          role: user.role,
          aal: aalData?.currentLevel,
        }
      );
      return { success: false, needsMfa: true, user };
    }
  } catch (err: any) {
    logAdminDenial("Exception during Supabase MFA assurance level check", {
      ip,
      path,
      userId: user.id,
      email: user.email,
      role: user.role,
      error: err,
    });
    return { success: false, needsMfa: true, user };
  }

  return { success: true, user, needsMfa: false };
}

export async function verifyAdminApi(req: NextRequest): Promise<CurrentUser | null> {
  const result = await verifyAdminApiDetailed(req);
  return result.success ? result.user : null;
}

/**
 * Server-side helper for page/layout components:
 * Renders 404 if caller is not an admin.
 * If caller is an admin but has NOT enrolled in MFA / not at AAL2, redirects to /admin/mfa.
 */
export async function requireAdminPage(currentPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    logAdminDenial("No active session / unauthenticated on admin page", { path: currentPath });
    redirect(`/login?redirect=${encodeURIComponent(currentPath || "/admin")}`);
  }

  if (!isAdminRole(user.role)) {
    logAdminDenial(`Role '${user.role}' is not allowed to access admin pages`, {
      path: currentPath,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    notFound();
  }

  if (user.is_suspended) {
    logAdminDenial("Admin account is suspended on admin page", {
      path: currentPath,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    notFound();
  }

  // Detect whether caller is on or targeting /admin/mfa across currentPath and all server headers
  let detectedPath = currentPath || "";
  try {
    const headersList = (await headers()) as any;
    detectedPath =
      currentPath ||
      headersList.get("x-mockmate-path") ||
      headersList.get("x-invoke-path") ||
      headersList.get("next-url") ||
      headersList.get("x-matched-path") ||
      "";
    const referer = headersList.get("referer") || "";
    if (!detectedPath && referer.includes("/admin/mfa")) {
      detectedPath = "/admin/mfa";
    }
  } catch {}

  const isMfaTarget =
    detectedPath === "/admin/mfa" ||
    detectedPath.startsWith("/admin/mfa") ||
    detectedPath.includes("/mfa");

  // If already on or targeting MFA page, allow rendering immediately without loop!
  if (isMfaTarget) {
    return user;
  }

  // Non-production test header check
  if (process.env.NODE_ENV !== "production") {
    try {
      const headersList = (await headers()) as any;
      if (headersList.get("x-test-auth-role")) {
        const mfa = headersList.get("x-test-auth-mfa-enrolled") !== "false";
        const aal = headersList.get("x-test-auth-aal") || "aal2";
        if (!mfa || aal !== "aal2") {
          logAdminDenial(`Test session is at '${aal}' (enrolled: ${mfa}). Redirecting to /admin/mfa`, {
            path: detectedPath,
            userId: user.id,
            email: user.email,
            role: user.role,
            aal,
          });
          const redirectTarget = detectedPath && detectedPath !== "/admin/mfa" && !detectedPath.includes("/mfa")
            ? `/admin/mfa?redirect=${encodeURIComponent(detectedPath)}`
            : "/admin/mfa";
          redirect(redirectTarget);
        }
        return user;
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
    }
  }

  // Live Supabase MFA verification
  try {
    const supabase = await createClient();
    const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr || aalData?.currentLevel !== "aal2") {
      logAdminDenial(
        `Session is at '${aalData?.currentLevel || "aal1"}', AAL2 required. Redirecting admin to /admin/mfa`,
        {
          path: detectedPath,
          userId: user.id,
          email: user.email,
          role: user.role,
          aal: aalData?.currentLevel,
          error: aalErr,
        }
      );
      const redirectTarget = detectedPath && detectedPath !== "/admin/mfa" && !detectedPath.includes("/mfa")
        ? `/admin/mfa?redirect=${encodeURIComponent(detectedPath)}`
        : "/admin/mfa";
      redirect(redirectTarget);
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    logAdminDenial("Exception querying MFA assurance level in requireAdminPage", {
      path: detectedPath,
      userId: user.id,
      email: user.email,
      role: user.role,
      error: err,
    });
    notFound();
  }

  return user;
}

/**
 * Higher-order wrapper for admin API endpoints.
 * Enforces:
 * - 404 masking for unauthorized/non-admin requests
 * - Least-privilege permission checks (returns 403 if authenticated admin lacks permission)
 * - Security response headers
 */
export function withAdminApi(
  handler: (adminUser: CurrentUser, req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options?: {
    requiredPermission?: AdminPermission;
    minRole?: AdminRole;
  }
) {
  return async (req: NextRequest, ...args: any[]) => {
    const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
    const path = req.nextUrl?.pathname || req.url;
    const authResult = await verifyAdminApiDetailed(req);

    if (!authResult.success) {
      if (authResult.needsMfa) {
        console.warn(
          `[ADMIN_API_MFA_REQUIRED] [${requestId}] [MFA_REQUIRED] path=${path} user=${authResult.user.email} status=403`
        );
        const res = NextResponse.json(
          {
            error: "2-Step verification (MFA/AAL2) required",
            code: "MFA_REQUIRED",
            mfa_required: true,
            redirect: "/admin/mfa",
            request_id: requestId,
          },
          { status: 403 }
        );
        return applyAdminSecurityHeaders(res);
      }

      // Strict 404 masking: non-admins and unauthenticated receive 404 with request ID
      console.warn(`[ADMIN_API_DENIED] [${requestId}] [ADMIN_404] path=${path} status=404`);
      const res = NextResponse.json(
        { error: "Not Found", code: "ADMIN_404", request_id: requestId },
        { status: 404 }
      );
      return applyAdminSecurityHeaders(res);
    }

    const adminUser = authResult.user;

    // Role / Permission check
    if (options?.requiredPermission) {
      if (!hasPermission(adminUser.role, options.requiredPermission)) {
        console.warn(
          `[ADMIN_API_FORBIDDEN] [${requestId}] [ADMIN_403] path=${path} role=${adminUser.role} requiredPerm=${options.requiredPermission}`
        );
        const res = NextResponse.json(
          {
            error: "Forbidden",
            code: "ADMIN_403",
            request_id: requestId,
            message: `Your role (${adminUser.role}) does not have permission '${options.requiredPermission}'`,
          },
          { status: 403 }
        );
        return applyAdminSecurityHeaders(res);
      }
    }

    try {
      const response = await handler(adminUser, req, ...args);
      response.headers.set("x-request-id", requestId);
      return applyAdminSecurityHeaders(response);
    } catch (err: any) {
      console.error(
        `[ADMIN_API_ERROR] [${requestId}] [ADMIN_500] path=${path} status=500 error=${err.message || err}`
      );
      const res = NextResponse.json(
        {
          error: "Internal Server Error",
          code: "ADMIN_500",
          request_id: requestId,
          message: err.message || "An administrative server operation failed",
        },
        { status: 500 }
      );
      return applyAdminSecurityHeaders(res);
    }
  };
}
