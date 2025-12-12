/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ❗ ESLint errors will NOT block builds anymore
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
