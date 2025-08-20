'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'wagmi/chains';
import { NEXT_PUBLIC_CDP_API_KEY } from '~/lib/constants';

// Per Farcaster docs, only the Farcaster connector is needed.
export const config = createConfig({
  chains: [base, baseSepolia],
  // Order matters: Farcaster first (Mini App), injected second (regular browser)
  connectors: [farcasterMiniApp(), injected()],
  multiInjectedProviderDiscovery: false,
  ssr: true, // Recommended to be true for server-side rendering
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={NEXT_PUBLIC_CDP_API_KEY}
          chain={process.env.NODE_ENV === 'production' ? base : baseSepolia}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
