/**
 * Google Tag Manager containers for the crash-course sites.
 *
 * One repo builds three sites. Each Cloudflare Pages project sets its own
 * NEXT_PUBLIC_CC_SLUG (for example `pri-sep-2026`), and the part before the
 * first hyphen names the platform. A container belongs to a SITE, not to a
 * course edition, so the map is keyed by platform: a new `pri-dec-2026` slug
 * picks up the Primary container with no change here.
 *
 * What each container fires is set in the GTM interface by the marketing
 * agency (Mustard), not in this repo.
 *
 * Every platform must have an entry: the map is a full Record, so adding a
 * platform without a container fails the type check.
 */
export type CrashCoursePlatform = "jc" | "ss" | "pri";

type GtmSite = {
  containerId: string;
  /** The hostnames that serve this site. Anything else loads nothing. */
  hostnames: readonly string[];
};

export const GTM_SITES: Readonly<Record<CrashCoursePlatform, GtmSite>> = {
  jc: {
    containerId: "GTM-T69DCPPH",
    hostnames: [
      "crashcourse.jc.zenitheducationstudio.com",
      "www.crashcourse.jc.zenitheducationstudio.com",
    ],
  },
  ss: {
    containerId: "GTM-WSFQX29S",
    hostnames: [
      "crashcourse.ss.zenitheducationstudio.com",
      "www.crashcourse.ss.zenitheducationstudio.com",
    ],
  },
  pri: {
    containerId: "GTM-W9TJKN3L",
    hostnames: [
      "crashcourse.pri.zenitheducationstudio.com",
      "www.crashcourse.pri.zenitheducationstudio.com",
    ],
  },
};

const PLATFORMS: readonly CrashCoursePlatform[] = ["jc", "ss", "pri"];

/** `pri-sep-2026` → `pri`. Returns null for anything that is not a known platform. */
export function platformFromSlug(slug: string | undefined): CrashCoursePlatform | null {
  const prefix = (slug ?? "").split("-")[0].toLowerCase();
  return (PLATFORMS as readonly string[]).includes(prefix)
    ? (prefix as CrashCoursePlatform)
    : null;
}

/**
 * The container this build should carry, known at build time from the slug
 * alone. The <noscript> fallback uses this, because it must work with
 * JavaScript off and so cannot check the hostname.
 */
export function gtmContainerForSlug(slug: string | undefined): string | null {
  const platform = platformFromSlug(slug);
  return platform ? GTM_SITES[platform].containerId : null;
}

/**
 * The container to load for this slug on this hostname, or null.
 *
 * The hostname check keeps preview deploys (`*.pages.dev`), local dev, and a
 * build served under the wrong domain out of the container. Branch topology
 * cannot do this job — see the regular-lessons history, where a prod-only tag
 * reached staging within four days.
 *
 * Matching is exact, so a lookalike such as
 * `crashcourse.pri.zenitheducationstudio.com.example.com` is refused.
 */
export function gtmContainerFor(
  slug: string | undefined,
  hostname: string
): string | null {
  const platform = platformFromSlug(slug);
  if (!platform) return null;
  const site = GTM_SITES[platform];
  const host = hostname.trim().toLowerCase();
  return site.hostnames.includes(host) ? site.containerId : null;
}
