/**
 * Simple Campaign Parameter Utility
 *
 * Replaces "SCHEDULE" with campaign parameter from URL
 */

/**
 * Get campaign parameter from URL, fallback to "SCHEDULE" if not present
 */
export function getCampaignParam(): string {
  if (typeof window === "undefined") {
    return "SCHEDULE";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("campaign") || "SCHEDULE";
}

/**
 * Replace "SCHEDULE" in URL with campaign parameter
 */
export function replaceCampaignInUrl(url: string): string {
  const campaignParam = getCampaignParam();
  return url.replace(/SCHEDULE/g, campaignParam);
}
