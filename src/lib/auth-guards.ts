// Abuse protection and validation utilities for Supabase Authentication

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com",
  "fakeinbox.com",
  "throwawaymail.com",
  "temp-mail.org",
  "temp-mail.io",
  "burnermail.io",
  "mohmal.com",
  "mytemp.email",
  "generator.email",
  "crazymailing.com",
  "dropmail.me",
  "inboxkitten.com",
  "maildrop.cc",
]);

/**
 * Checks whether an email belongs to a known temporary/disposable domain.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.trim().toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

export interface PasswordStrength {
  score: number; // 0 (weak) to 4 (very strong)
  label: "Weak" | "Fair" | "Good" | "Strong";
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password strength (min 8 characters, mix of casing and numbers/symbols).
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push("Must be at least 8 characters long");
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let criteriaCount = 0;
  if (password.length >= 8) criteriaCount++;
  if (hasLower && hasUpper) criteriaCount++;
  if (hasNumber) criteriaCount++;
  if (hasSpecial) criteriaCount++;

  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  if (criteriaCount <= 1) label = "Weak";
  else if (criteriaCount === 2) label = "Fair";
  else if (criteriaCount === 3) label = "Good";
  else label = "Strong";

  return {
    score: criteriaCount,
    label,
    isValid: password.length >= 8,
    errors,
  };
}

// In-memory IP/Identifier rate limiter for auth abuse protection
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * In-memory sliding rate limiter.
 * Default: 5 attempts per 60 seconds per IP or email.
 */
export function checkAuthRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

/**
 * Sanitizes redirect target paths to prevent open-redirect vulnerabilities.
 * Only allows relative paths starting with a single '/' and rejecting '//', '/\',
 * protocol-relative URLs, javascript:, and absolute URLs.
 */
export function getSafeRedirectPath(
  rawPath: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!rawPath) return fallback;
  const trimmed = rawPath.trim();

  // Must start with single slash, reject double slash or backslash (protocol-relative/UNC)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject URLs with explicit schemes (e.g. "javascript:", "data:", "http:")
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  try {
    const dummy = new URL(trimmed, "http://localhost");
    // Ensure the hostname is still localhost and protocol is http:
    if (dummy.hostname !== "localhost" || dummy.protocol !== "http:") {
      return fallback;
    }
    return dummy.pathname + dummy.search + dummy.hash;
  } catch {
    return fallback;
  }
}


