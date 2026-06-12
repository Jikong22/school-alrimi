import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Force webpack mode for @serwist/next compatibility
  // (Next.js 16 defaults to Turbopack which doesn't support webpack plugins)
};

export default withSerwist(nextConfig);