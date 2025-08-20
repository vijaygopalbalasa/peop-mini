import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Allow embedding by Farcaster clients, including Warpcast and the dev tools.
            value:
              "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz http://localhost:*"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
