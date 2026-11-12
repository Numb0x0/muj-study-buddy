"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Web Analytics (anonymous, cookieless page-view counts) and Speed
 * Insights (real-visitor Core Web Vitals: LCP, INP, CLS, FCP, TTFB) — see /privacy.
 * Admin pages are excluded from both so the numbers reflect what students see.
 * Neither does anything locally; their scripts only run on Vercel deployments
 * with the feature enabled in the project dashboard.
 */
function isAdminUrl(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/admin");
  } catch {
    return false;
  }
}

function dropAdmin<E extends { url: string }>(event: E): E | null {
  return isAdminUrl(event.url) ? null : event;
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={dropAdmin} />
      <SpeedInsights beforeSend={dropAdmin} />
    </>
  );
}
