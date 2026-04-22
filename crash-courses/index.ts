import type { CrashCourseConfig } from "./types";
import jcSep2025 from "./jc-sep-2025/config";
import ssSep2025 from "./ss-sep-2025/config";

const REGISTRY: Record<string, CrashCourseConfig> = {
  "jc-sep-2025": jcSep2025,
  "ss-sep-2025": ssSep2025,
};

export function getCrashCourseConfig(): CrashCourseConfig {
  const slug = process.env.NEXT_PUBLIC_CC_SLUG;
  if (!slug) {
    throw new Error(
      "NEXT_PUBLIC_CC_SLUG is not set. Set it in the Cloudflare Pages project env vars (e.g. `ss-sep-2025` or `jc-sep-2025`)."
    );
  }
  const config = REGISTRY[slug];
  if (!config) {
    throw new Error(
      `Unknown crash course slug: "${slug}". Known slugs: ${Object.keys(REGISTRY).join(", ")}`
    );
  }
  return config;
}

export function getAllRegisteredConfigs(): CrashCourseConfig[] {
  return Object.values(REGISTRY);
}

export type { CrashCourseConfig } from "./types";
