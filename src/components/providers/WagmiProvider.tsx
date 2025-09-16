'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useMemo } from 'react';

const queryClient = new QueryClient();

// Build wagmi config at runtime to avoid injecting Farcaster connector in normal browsers
function useWagmiConfig() {
  return useMemo(() => {
    return createConfig({
      chains: [base, baseSepolia],
      connectors: [farcasterMiniApp()],
      multiInjectedProviderDiscovery: false,
      ssr: true,
      transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
    });
  }, []);
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const config = useWagmiConfig();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
