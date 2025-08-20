'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { NEXT_PUBLIC_CDP_API_KEY } from '~/lib/constants';

// Per Farcaster docs, only the Farcaster connector is needed.
const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [farcasterMiniApp()],
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
