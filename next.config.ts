import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: [
    "192.168.137.1",
    "192.168.137.1:3000",
    "172.22.155.41",
    "172.22.155.41:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.137.1:3000",
        "192.168.137.1",
        "172.22.155.41:3000",
        "172.22.155.41",
        "localhost:3000",
        "127.0.0.1:3000",
        "0.0.0.0:3000",
      ],
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
