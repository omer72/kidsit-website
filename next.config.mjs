/** @type {import('next').NextConfig} */
// Bare /privacy, /terms, /support and /accessibility are redirected by language in src/middleware.ts.
// www → apex (P10): host match only; path and query are preserved. Domains themselves are unchanged in Vercel.
const nextConfig = {
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
