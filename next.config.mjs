/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
      { source: "/privacy", destination: "/en/privacy", permanent: false },
      { source: "/terms", destination: "/en/terms", permanent: false },
    ];
  },
};

export default nextConfig;
