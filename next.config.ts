import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Output configuration
  outputFileTracingRoot: __dirname,

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['ethers', 'lucide-react'],
  },

  // External packages
  serverExternalPackages: ['sharp'],

  // Webpack configuration for security and performance
  webpack: (config, { dev, isServer }) => {
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Security: Remove source maps in production
    if (!dev && !isServer) {
      config.devtool = false;
    }

    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
      };
    }

    return config;
  },


  // Security headers and redirects
  async redirects() {
    return [
      {
        source: '/api',
        destination: '/404',
        permanent: false,
      },
    ];
  },
  async headers() {
    const allowedOrigins = [
      'https://warpcast.com',
      'https://*.warpcast.com',
      'https://*.farcaster.xyz',
      'https://*.base.org',
      'https://base.org',
      'https://www.base.dev',
      'https://*.base.dev',
      'https://coinbase.com',
      'https://*.coinbase.com',
      'https://wallet.coinbase.com',
      'https://*.wallet.coinbase.com',
      'https://peop-mini.vercel.app'
    ];

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(' '),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-Real-IP, X-Forwarded-For',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'nonce-' https://pulse.walletconnect.org https://cca-lite.coinbase.com https://*.walletconnect.org https://*.coinbase.com;
              worker-src 'self' blob: data:;
              connect-src 'self' data: blob: https://api.basescan.org https://mainnet.base.org https://pulse.walletconnect.org https://cca-lite.coinbase.com wss://*.walletconnect.org wss://*.coinbase.com https://*.coinbase.com https://*.walletconnect.org https://*.walletconnect.com https://relay.walletconnect.org https://relay.walletconnect.com https://rpc.walletconnect.org https://explorer-api.walletconnect.com https://notify.walletconnect.com https://auth.farcaster.xyz;
              img-src 'self' data: blob: https://*.walletconnect.org https://*.coinbase.com;
              style-src 'self' 'nonce-';
              font-src 'self' data:;
              frame-ancestors ${allowedOrigins.join(' ')};
              frame-src 'self' https://*.walletconnect.org https://*.coinbase.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self "https://peop-mini.vercel.app"), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ].filter(header => header.value), // Remove empty headers
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(' '),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-Real-IP, X-Forwarded-For',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '3600',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/(circuit\\.wasm|circuit_final\\.zkey)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ];
  },
};

// Environment validation will be handled at runtime by the config.ts file
// This avoids issues with dotenv loading order during build

export default nextConfig;
