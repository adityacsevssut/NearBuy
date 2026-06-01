import type { NextConfig } from "next";

// Do NOT set Cross-Origin-Opener-Policy here. Even "same-origin-allow-popups" can block
// Google's OAuth popup client from reading popup.closed(), which breaks sign-in.

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

};

export default nextConfig;
