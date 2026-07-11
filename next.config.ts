import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the app is fully client-side (localStorage), so it ships
  // as plain HTML/JS served by a Cloudflare Worker's static assets.
  output: "export",
};

export default nextConfig;
