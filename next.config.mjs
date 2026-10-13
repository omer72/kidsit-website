/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: "/en/privacy", permanent: false },
      { source: "/terms", destination: "/en/terms", permanent: false },
    ];
  },
};

export default nextConfig;
