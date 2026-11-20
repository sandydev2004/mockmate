/**
 * Privacy-friendly, zero-PII client event tracker.
 * Only emits events if NEXT_PUBLIC_ENABLE_ANALYTICS === "true".
 * Never tracks personal identifiers, IP addresses, or keystrokes.
 */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;

  const enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
  if (!enabled) return;

  try {
    const payload = {
      event: name,
      timestamp: new Date().toISOString(),
      properties: props || {},
    };

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`[ANALYTICS] ${name}:`, props);
    }

    // Dispatch custom DOM event for lightweight extensible observers
    window.dispatchEvent(new CustomEvent("mockmate_analytics", { detail: payload }));
  } catch {
    // Fail silently without disrupting user experience
  }
}
