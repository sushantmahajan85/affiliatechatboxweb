import type { NextConfig } from "next";
import { getSecurityHeaders, STATIC_CACHE_HEADERS } from "./src/lib/security-headers";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    if (!isProduction) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(true),
      },
      {
        source: "/assets/:path*",
        headers: STATIC_CACHE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
