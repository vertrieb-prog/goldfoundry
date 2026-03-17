/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["metaapi.cloud-sdk", "telegram"],
  },
};

module.exports = nextConfig;
