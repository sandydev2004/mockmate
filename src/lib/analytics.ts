import { track } from "@vercel/analytics";

export type FunnelEvent =
  | "landing_view"
  | "signup_completed"
  | "first_interview_started"
  | "payment_settled"
  | "pricing_viewed"
  | "checkout_started"
  | "payment_success"
  | "payment_failed";

/**
 * Tracks critical student funnel conversion milestones.
 */
export function trackFunnel(
  event: FunnelEvent,
  props?: Record<string, string | number | boolean>
) {
  trackEvent(event, props);
}

/**
 * Privacy-friendly event tracker powered by Vercel Web Analytics.
 * Never tracks personal identifiers, raw passwords, or keystrokes.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  try {
    // Report to Vercel Analytics
    track(name, props);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[ANALYTICS: ${name}]`, props);
    }

    // Dispatch custom DOM event for light UI observers
    window.dispatchEvent(
      new CustomEvent("mockmate_analytics", {
        detail: {
          event: name,
          timestamp: new Date().toISOString(),
          properties: props || {},
        },
      })
    );
  } catch {
    // Fail silently without disrupting UX
  }
}
