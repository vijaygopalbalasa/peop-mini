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
            // Allow embedding by Base Mini Apps, Farcaster clients, and preview tools
            value:
              "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz https://*.base.org https://base.org https://www.base.dev https://*.base.dev https://preview.base.org https://*.preview.base.org https://app.base.org https://*.app.base.org https://coinbase.com https://*.coinbase.com https://wallet.coinbase.com https://*.wallet.coinbase.com http://localhost:* https://localhost:*",
          },
          {
            key: 'X-Frame-Options',
            // Explicitly allow framing (removes any default DENY)
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
