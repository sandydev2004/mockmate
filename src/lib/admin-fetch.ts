export interface AdminFetchResult<T> {
  data: T | null;
  error: string | null;
  code?: string;
  requestId?: string;
}

/**
 * Fetch helper for admin client pages:
 * 1. 15-second timeout via AbortController
 * 2. Extracts x-request-id and error codes for Vercel log tracking
 * 3. Handles 404 MFA/permission denials gracefully
 */
export async function adminFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<AdminFetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const headerReqId = res.headers.get("x-request-id") || undefined;
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const requestId = body?.request_id || body?.requestId || headerReqId;
      const code = body?.code;

      // Handle MFA / Step-up authentication requirement: redirect to /admin/mfa
      if (res.status === 403 && (code === "MFA_REQUIRED" || body?.mfa_required)) {
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const redirectTarget = currentPath && currentPath !== "/admin/mfa" ? currentPath : "/admin";
          window.location.href = `/admin/mfa?redirect=${encodeURIComponent(redirectTarget)}`;
        }
        return {
          data: null,
          error: "2-Step verification (MFA/AAL2) required. Redirecting to verification...",
          code: "MFA_REQUIRED",
          requestId,
        };
      }

      if (res.status === 404) {
        return {
          data: null,
          error:
            body?.error ||
            "Access denied or session unverified. If you are an administrator, your session may require 2-step verification (MFA/AAL2).",
          code: code || "ADMIN_404",
          requestId,
        };
      }
      return {
        data: null,
        error: body?.error || body?.message || `Request failed (HTTP ${res.status})`,
        code: code || `HTTP_${res.status}`,
        requestId,
      };
    }

    return {
      data: body as T,
      error: null,
      requestId: body?.request_id || body?.requestId || headerReqId,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        data: null,
        error: "Request timed out after 15 seconds. Please check database connectivity and retry.",
        code: "TIMEOUT",
      };
    }
    return {
      data: null,
      error: err.message || "Network error occurred",
      code: "NETWORK_ERROR",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
