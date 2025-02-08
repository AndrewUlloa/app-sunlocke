/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config options ...
  async rewrites() {
    return [
      {
        source: '/auth/callback',
        destination: '/auth/callback',
      },
    ]
  },
}

module.exports = nextConfig 