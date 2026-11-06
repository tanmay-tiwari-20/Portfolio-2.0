import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone",
  // Keep the isolated admin verification server separate from an existing dev server.
  ...(process.env.ADMIN_TEST_MODE === "1" ? { distDir: ".next-admin-test" } : {}),
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }, { protocol: "https", hostname: "images.unsplash.com" }] },
  async headers() { return [{ source: "/(.*)", headers: [
    { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://res.cloudinary.com https://images.unsplash.com https://api.cloudinary.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
  ] }]; }
};
export default nextConfig;
