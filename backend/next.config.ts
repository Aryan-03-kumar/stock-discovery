import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/download-bundle": ["./templates/**/*"],
  },
};

export default nextConfig;
