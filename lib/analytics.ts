/**
 * Google Analytics 4 — lightweight event helper for Aegis AI.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("audit_started", { media_type: "image" });
 *
 * GA is loaded via <Script> in app/layout.tsx.  If gtag isn't present
 * (ad-blocker, local dev, etc.) every call is a silent no-op.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const GA_MEASUREMENT_ID = "G-V860BRCQEM";

/** Low-level gtag wrapper — safe to call even if GA didn't load. */
export function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...(args as Parameters<NonNullable<Window["gtag"]>>));
  }
}

/** Track a custom GA4 event with optional parameters. */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  gtag("event", eventName, params);
}

// ── Pre-built Aegis events ─────────────────────────────────────────

export function trackAuditStarted(mediaType: string, fileName: string) {
  trackEvent("audit_started", {
    media_type: mediaType,
    file_name: fileName.slice(0, 80),
  });
}

export function trackAuditCompleted(
  riskTier: string,
  score: number,
  mlStatus: string
) {
  trackEvent("audit_completed", {
    risk_tier: riskTier,
    score,
    ml_api_status: mlStatus,
  });
}

export function trackReportExported(format: string) {
  trackEvent("report_exported", { format });
}

export function trackContactFormSubmit() {
  trackEvent("contact_form_submit");
}
