import type { NextConfig } from "next";
import { SITE_ALIASES, SITE_URL } from "./lib/site";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  trailingSlash: false,
  // Normalize the host, legacy route and trailing slash in one redirect.
  // Next's built-in slash redirect otherwise runs before the host rules.
  skipTrailingSlashRedirect: true,
  // Complete page-specific metadata in the response head for all consumers,
  // including preview tools and crawlers that do not execute JavaScript.
  htmlLimitedBots: /.*/,
  ...(process.env.ADMIN_TEST_MODE === "1"
    ? { distDir: ".next-admin-test" }
    : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      ...SITE_ALIASES.flatMap((host) => [
        ...["/experience", "/experience/"].map((source) => ({
          source,
          has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
          destination: `${SITE_URL}/about`,
          permanent: true,
        })),
        {
          source: "/:path+/",
          has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
          destination: `${SITE_URL}/:path+`,
          permanent: true,
        },
        {
          source: "/:path*",
          has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
          destination: `${SITE_URL}/:path*`,
          permanent: true,
        },
      ]),
      { source: "/experience", destination: "/about", permanent: true },
      { source: "/experience/", destination: "/about", permanent: true },
      { source: "/:path+/", destination: "/:path+", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://res.cloudinary.com https://images.unsplash.com https://api.cloudinary.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          ...(process.env.VERCEL_ENV === "preview"
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
        ],
      },
      {
        source: "/secret-admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};
export default nextConfig;
