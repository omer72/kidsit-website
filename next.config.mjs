/** @type {import('next').NextConfig} */
// Bare /privacy, /terms, /support and /accessibility are redirected by language in src/middleware.ts.
// www → apex (P10): host match only; path and query are preserved. Domains themselves are unchanged in Vercel.
const nextConfig = {
  // /admin is private: never indexed, never stored by shared caches.
  async headers() {
    return [
      // Universal Links: Apple fetches this extension-less file and needs JSON with a 200 and no redirect.
      // The path has a dot (.well-known), so the locale middleware does not touch it.
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.kidsit.ai" }],
        destination: "https://kidsit.ai/:path*",
        permanent: true, // 308
      },
    ];
  },
};

export default nextConfig;
