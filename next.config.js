/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "metaapi.cloud-sdk", "telegram"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("metaapi.cloud-sdk", "telegram");
    }
    return config;
  },
  async redirects() {
    return [
      { source: '/risk-disclaimer', destination: '/risikohinweis', permanent: true },
      { source: '/dashboard/copier', destination: '/dashboard/trader', permanent: true },
      // Public pages being removed
      { source: '/crypto/:path*', destination: '/', permanent: true },
      { source: '/exchange/:path*', destination: '/', permanent: true },
      { source: '/partner/:path*', destination: '/', permanent: true },
      { source: '/smart-copier', destination: '/', permanent: true },
      { source: '/telegram-copier', destination: '/', permanent: true },
      { source: '/forge-mentor', destination: '/', permanent: true },
      { source: '/risk-shield', destination: '/', permanent: true },
      { source: '/strategy-lab', destination: '/', permanent: true },
      { source: '/leaderboard', destination: '/', permanent: true },
      { source: '/trader/:path*', destination: '/', permanent: true },
      { source: '/vergleich/:path*', destination: '/', permanent: true },
      { source: '/asset/:path*', destination: '/', permanent: true },
      { source: '/tools/:path*', destination: '/', permanent: true },
      { source: '/blog/:path*', destination: '/', permanent: true },
      { source: '/news/:path*', destination: '/', permanent: true },
      { source: '/events/:path*', destination: '/', permanent: true },
      { source: '/compare/:path*', destination: '/', permanent: true },
      { source: '/glossary/:path*', destination: '/', permanent: true },
      { source: '/kurs/:path*', destination: '/', permanent: true },
      { source: '/lernen/:path*', destination: '/', permanent: true },
      { source: '/wissen/:path*', destination: '/', permanent: true },
      { source: '/links', destination: '/', permanent: true },
      { source: '/pricing', destination: '/', permanent: true },
      { source: '/strategy/:path*', destination: '/', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
