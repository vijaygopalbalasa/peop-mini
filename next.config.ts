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
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Content-Security-Policy',
            // Allow embedding and external resources with comprehensive wallet service support
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pulse.walletconnect.org https://cca-lite.coinbase.com https://*.walletconnect.org https://*.coinbase.com;
              connect-src 'self' https://api.basescan.org https://mainnet.base.org https://sepolia.base.org https://pulse.walletconnect.org https://cca-lite.coinbase.com wss://* https://*.coinbase.com https://*.walletconnect.org https://*.walletconnect.com https://relay.walletconnect.org https://relay.walletconnect.com https://rpc.walletconnect.org https://explorer-api.walletconnect.com https://notify.walletconnect.com;
              img-src 'self' data: blob: https: https://*.walletconnect.org https://*.coinbase.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self' data:;
              frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz https://*.base.org https://base.org https://www.base.dev https://*.base.dev https://coinbase.com https://*.coinbase.com https://wallet.coinbase.com https://*.wallet.coinbase.com http://localhost:* https://localhost:*;
              frame-src 'self' https://*.walletconnect.org https://*.coinbase.com;
              object-src 'none';
              base-uri 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Specific CORS headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
