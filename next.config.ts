import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow embedding by Base Mini Apps and Farcaster clients
            value:
              "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz https://*.base.org http://localhost:*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
