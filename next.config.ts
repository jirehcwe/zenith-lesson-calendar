import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Exclude scripts folder from webpack processing
    config.module.rules.push({
      test: /scripts\//,
      loader: "ignore-loader",
    });

    return config;
  },
  // Exclude scripts from static file serving
  async rewrites() {
    return [];
  },
};

export default nextConfig;
