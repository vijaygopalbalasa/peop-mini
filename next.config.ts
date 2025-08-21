import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@farcaster/frame-sdk': require.resolve('@farcaster/miniapp-sdk'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow embedding by Farcaster clients, including Warpcast and the dev tools.
            value:
              "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz http://localhost:*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
