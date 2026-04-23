import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    // crash-courses/index.ts uses require("fs") / require("path") guarded by
    // isNodeRuntime(). Those branches never execute in the browser, but webpack
    // still tries to resolve them. Tell it to stub them out instead of failing.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
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
