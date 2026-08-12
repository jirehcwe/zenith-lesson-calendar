/** GA4 measurement ID for the public schedule site. */
export const GA_MEASUREMENT_ID = "G-GX27V89PJK";

/**
 * The hostnames that serve the real, public schedule site. Both are Cloudflare Pages
 * aliases of the production deployment.
 */
const ANALYTICS_HOSTNAMES: ReadonlySet<string> = new Set([
  "schedule.zenitheducationstudio.com",
  "www.schedule.zenitheducationstudio.com",
]);

/**
 * Decides whether to load the Google tag for a given hostname.
 *
 * Branch topology cannot carry this decision. The tag first shipped only on
 * `regular-lessons` so the staging tree would stay untagged, and within four days a
 * prod-to-staging sync had copied it across anyway. The hostname is the stable signal,
 * so preview deploys (`*.pages.dev`), the staging branch, and local dev all stay out
 * of GA4 no matter which branch they were built from.
 *
 * Matching is exact — a suffix check would accept lookalikes such as
 * `schedule.zenitheducationstudio.com.example.com`.
 */
export function shouldLoadAnalytics(hostname: string): boolean {
  return ANALYTICS_HOSTNAMES.has(hostname.trim().toLowerCase());
}
