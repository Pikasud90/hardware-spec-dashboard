import type { NextConfig } from "next";

/**
 * The dashboard ships as a fully static, offline-first bundle.
 *
 * `output: "export"` emits a self-contained `out/` directory with no Node.js
 * server requirement, which is what makes the identical artifact usable as
 * (a) a plain static site, and (b) the renderer payload inside the Electron
 * desktop builds for macOS and Windows.
 *
 * `trailingSlash` makes every route resolve to `<route>/index.html`, which lets
 * the Electron custom protocol handler map URLs to files with a trivial rule.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // Static export cannot run the on-demand image optimizer.
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
