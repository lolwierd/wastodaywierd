import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force Turbopack root to this project to avoid parent lockfile confusion
    root: __dirname,
  },
};

export default nextConfig;
