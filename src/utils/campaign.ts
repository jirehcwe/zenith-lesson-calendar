/**
 * Simple Campaign & Promocode Parameter Utilities
 *
 * Replaces "SCHEDULE" with campaign parameter from URL
 * Replaces "PROMOCODE" with promocode parameter from URL
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

/**
 * Get promocode parameter from URL, fallback to empty string if not present
 */
export function getPromocodeParam(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("promocode") || "";
}

/**
 * Replace "PROMOCODE" in URL with promocode parameter
 */
export function replacePromocodeInUrl(url: string): string {
  const promocodeParam = getPromocodeParam();
  return url.replace(/PROMOCODE/g, promocodeParam);
}
