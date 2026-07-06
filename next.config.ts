import type { NextConfig } from "next";

// Build-time guard: fail the build (incl. Cloudflare) if the schedule endpoint
// isn't configured, before a broken static export ships. Skipped under tests,
// which load this config via next/jest without an endpoint set.
if (process.env.NODE_ENV !== "test") {
  const apiBaseUrl = process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error(
      "Build aborted: NEXT_PUBLIC_SCHEDULE_API_BASE_URL is not set.\n" +
        "Set it in Cloudflare Pages → Settings → Variables and Secrets for BOTH " +
        "the Production and Preview environments, or in .env.local for local builds."
    );
  }
  console.log(`✓ NEXT_PUBLIC_SCHEDULE_API_BASE_URL = ${apiBaseUrl}`);
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Note: with `output: "export"` Next.js does not apply `headers()` — a static
  // export emits no server. Real HTTP headers for this site come from Cloudflare
  // Pages (`_headers` file / dashboard), so any config here would be a silent
  // no-op. (A prior `async headers()` CORS block was removed for this reason —
  // an ACAO header on our own static pages did nothing anyway. CAL-03.)
};

export default nextConfig;
