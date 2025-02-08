/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(m4a|aac)$/,
      use: { loader: 'file-loader' }
    })
    return config
  },
  async rewrites() {
    return [
      {
        source: '/auth/callback',
        destination: '/auth/callback',
      },
    ]
  },
};
export default nextConfig;
