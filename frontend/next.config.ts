import type { NextConfig } from "next";

// Do NOT set Cross-Origin-Opener-Policy here. Even "same-origin-allow-popups" can block
// Google's OAuth popup client from reading popup.closed(), which breaks sign-in.

// Security headers applied to all routes
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy",
    value: [
      // Only load scripts from self, Google APIs, Firebase, Razorpay, Geoapify
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com https://checkout.razorpay.com https://api.geoapify.com",
      // Styles from self + Google Fonts + inline styles (needed by Next.js + many libs)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts from Google Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images: self + data URIs + blob (for map tiles, previews) + all HTTPS
      "img-src 'self' data: blob: https:",
      // API calls: self + backend + Google + Firebase + Razorpay + Geoapify + maps
      "connect-src 'self' http://localhost:5000 https://localhost:5000 https://*.googleapis.com https://*.firebaseio.com https://fcm.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.razorpay.com wss://*.firebaseio.com https://api.geoapify.com https://maps.googleapis.com",
      // Frames allowed for Google Sign-In, Razorpay
      "frame-src 'self' https://accounts.google.com https://api.razorpay.com https://checkout.razorpay.com",
      // Media from self + blob
      "media-src 'self' blob:",
      // Workers from self + blob (Firebase SW)
      "worker-src 'self' blob:",
      // Manifest from self
      "manifest-src 'self'",
    ].join("; "),
  },
];

const config = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

const nextConfig: NextConfig = config as any;

export default nextConfig;
