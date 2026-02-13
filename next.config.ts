import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": ["./public/gai-source.pptx"],
  },
};

export default nextConfig;
