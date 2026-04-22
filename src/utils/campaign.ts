export function getCampaignParam(): string {
  if (typeof window === "undefined") return "SCHEDULE";
  return (
    new URLSearchParams(window.location.search).get("campaign") || "SCHEDULE"
  );
}

export function replaceCampaignInUrl(url: string): string {
  return url.replace(/SCHEDULE/g, getCampaignParam());
}

export function getPromocodeParam(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("promocode") || "";
}

export function replacePromocodeInUrl(url: string): string {
  return url.replace(/PROMOCODE/g, getPromocodeParam());
}

export function replaceUrlPlaceholders(url: string): string {
  return replacePromocodeInUrl(replaceCampaignInUrl(url));
}
