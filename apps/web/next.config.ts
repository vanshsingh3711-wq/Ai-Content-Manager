import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },


  // ── Compiler optimizations ────────────────────────────────
  compiler: {
    // Remove console.log calls in production builds (keep warn/error)
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["warn", "error"] }
        : false,
  },

  // ── Image optimization ────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
    // Wider device widths for responsive srcsets
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── HTTP headers ──────────────────────────────────────────
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      ...(!isDev
        ? [
            {
              // Immutable cache for hashed static assets (production only, avoids breaking dev HMR)
              source: "/_next/static/:path*",
              headers: [
                { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
              ],
            },
          ]
        : []),
      {
        // Secure defaults for all dashboard routes
        source: "/dashboard/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ── API reverse proxy ─────────────────────────────────────
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
