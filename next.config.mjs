/** @type {import('next').NextConfig} */
// Bare /privacy, /terms, /support and /accessibility are redirected by language in src/middleware.ts.
// www → apex (P10): host match only; path and query are preserved. Domains themselves are unchanged in Vercel.
// The three rules below mirror middleware's LOCALIZED set and /blog special case so a www hit on one of
// those paths lands on the final localized apex URL in one redirect instead of bouncing through bare apex
// first (middleware would then add its own locale redirect as a second hop). With no Accept-Language signal
// (the common crawler case) middleware defaults to English too, so this doesn't change that outcome — it only
// removes the extra hop. A Hebrew-preferring visitor who starts at www (not a real traffic path: nothing
// links to www) gets English on first paint and can switch language in-page, same as any other first-visit.
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
        source: "/",
        has: [{ type: "host", value: "www.kidsit.ai" }],
        destination: "https://kidsit.ai/en",
        permanent: true,
      },
      {
        source: "/:path(privacy|terms|support|accessibility|about|editorial-policy)",
        has: [{ type: "host", value: "www.kidsit.ai" }],
        destination: "https://kidsit.ai/en/:path",
        permanent: true,
      },
      {
        source: "/blog/:path*",
        has: [{ type: "host", value: "www.kidsit.ai" }],
        destination: "https://kidsit.ai/he/blog/:path*",
        permanent: true,
      },
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
