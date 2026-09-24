/**
 * Google Tag Manager container for the public schedule site.
 *
 * The site used to load gtag.js directly against a GA4 property. Tag ownership moved
 * into GTM so the marketing agency can manage tags without a code deploy — what this
 * container actually fires is configured in the GTM interface, not here.
 */
export const GTM_CONTAINER_ID = "GTM-NTBDX6K2";

/**
 * The hostnames that serve the real, public schedule site. Both are Cloudflare Pages
 * aliases of the production deployment.
 */
const ANALYTICS_HOSTNAMES: ReadonlySet<string> = new Set([
  "schedule.zenitheducationstudio.com",
  "www.schedule.zenitheducationstudio.com",
]);

/**
 * Decides whether to load the container for a given hostname.
 *
 * Branch topology cannot carry this decision. The original tag shipped only on
 * `regular-lessons` so the staging tree would stay untagged, and within four days a
 * prod-to-staging sync had copied it across anyway. The hostname is the stable signal,
 * so preview deploys (`*.pages.dev`), the staging branch, and local dev all stay out
 * of analytics no matter which branch they were built from.
 *
 * Matching is exact — a suffix check would accept lookalikes such as
 * `schedule.zenitheducationstudio.com.example.com`.
 */
export function shouldLoadAnalytics(hostname: string): boolean {
  return ANALYTICS_HOSTNAMES.has(hostname.trim().toLowerCase());
}
