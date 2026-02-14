import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": ["./public/gai-blank.pptx"],
  },
};

export default nextConfig;
