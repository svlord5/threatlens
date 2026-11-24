import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Lets a second dev/build run use its own folder (NEXT_DIST_DIR) without touching a running dev server's .next.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  /* config options here */
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  transpilePackages: ['recharts'],
  serverExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'puppeteer-core', 'puppeteer'],
  // Legal and contact pages live on the owner's site. Same-origin paths keep the in-app links
  // stable, and the target can be changed with LEGAL_BASE_URL (no trailing slash).
  async redirects() {
    const base = (process.env.LEGAL_BASE_URL || "https://surajv5.in").replace(/\/+$/, "");
    const pages = ["terms", "privacy", "cookies", "disclaimer", "security", "report", "contact", "legal"];
    return pages.map((page) => ({
      source: `/${page}`,
      destination: `${base}/${page}`,
      permanent: false,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents Clickjacking by disallowing iframing
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none';",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Recommended security header
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Recommended security header
          }
        ],
      },
    ];
  },
};

export default nextConfig;

// Force dev server restart to clear Turbopack cache after Recharts downgrade
