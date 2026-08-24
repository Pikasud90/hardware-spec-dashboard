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
/**
 * GitHub Pages serves project sites from a subpath. The Pages workflow sets
 * NEXT_PUBLIC_BASE_PATH; every other build (local, Electron, any static host
 * rooted at "/") leaves it empty and serves from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
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
