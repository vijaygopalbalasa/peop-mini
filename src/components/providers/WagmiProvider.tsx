'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'wagmi/chains';
import { NEXT_PUBLIC_CDP_API_KEY } from '~/lib/constants';
import { useMemo } from 'react';

// Build wagmi config at runtime to avoid injecting Farcaster connector in normal browsers
function useWagmiConfig() {
  return useMemo(() => {
    const isMiniApp =
      typeof window !== 'undefined' && typeof (window as any).farcaster !== 'undefined';
    const connectors = isMiniApp ? [farcasterMiniApp()] : [injected()];
    return createConfig({
      chains: [base, baseSepolia],
      connectors,
      multiInjectedProviderDiscovery: false,
      ssr: true, // Recommended to be true for server-side rendering
      transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
    });
  }, []);
}

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  const config = useWagmiConfig();
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
