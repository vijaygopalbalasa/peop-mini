'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { NEXT_PUBLIC_CDP_API_KEY, NEXT_PUBLIC_REOWN_PROJECT_ID } from '~/lib/constants';
import { useMemo } from 'react';

const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: 'peop-mini',
  description: 'Proof-of-Existence-Passport',
  url: 'https://peop.id', // origin must match your domain & subdomain
  icons: ['https://peop.id/icon.png'],
};

// Build wagmi config at runtime to avoid injecting Farcaster connector in normal browsers
function useWagmiConfig() {
  return useMemo(() => {
    const isMiniApp =
      typeof window !== 'undefined' && typeof (window as any).farcaster !== 'undefined';

    if (isMiniApp) {
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
    }

    const wagmiAdapter = new WagmiAdapter({
      projectId: NEXT_PUBLIC_REOWN_PROJECT_ID,
      networks: [base, baseSepolia],
      ssr: true,
    });

    createAppKit({
      adapters: [wagmiAdapter],
      projectId: NEXT_PUBLIC_REOWN_PROJECT_ID,
      networks: [base, baseSepolia],
      defaultNetwork: base,
      metadata: metadata,
    });

    return wagmiAdapter.wagmiConfig;
  }, []);
}

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
