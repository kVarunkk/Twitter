import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint warnings and errors during build
  },
};

export default nextConfig;
