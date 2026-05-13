import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Google Sign-In uses window.postMessage between the popup / FedCM flow and the app.
  // Without this, strict COOP (e.g. same-origin) can block sign-in in production.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
