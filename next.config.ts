import type { NextConfig } from "next";

// Build-time guard: fail the build (incl. Cloudflare) if the schedule endpoint
// isn't configured, before a broken static export ships. Skipped under tests,
// which load this config via next/jest without an endpoint set.
if (process.env.NODE_ENV !== "test") {
  const endpoint = process.env.NEXT_PUBLIC_SCHEDULE_ENDPOINT;
  if (!endpoint) {
    throw new Error(
      "Build aborted: NEXT_PUBLIC_SCHEDULE_ENDPOINT is not set.\n" +
        "Set it in Cloudflare Pages → Settings → Variables and Secrets for BOTH " +
        "the Production and Preview environments, or in .env.local for local builds."
    );
  }
  console.log(`✓ NEXT_PUBLIC_SCHEDULE_ENDPOINT = ${endpoint}`);
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*", // Apply to all paths
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.zenitheducationstudio.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Accept",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
