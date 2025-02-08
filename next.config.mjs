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
  async headers() {
    return [
      {
        source: '/auth/callback',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
};
export default nextConfig;
