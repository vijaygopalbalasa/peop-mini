'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useMemo } from 'react';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

// Build wagmi config at runtime to support both miniapp and browser environments
function useWagmiConfig() {
  return useMemo(() => {
    const connectors = [];

    // Always add Farcaster MiniApp connector for miniapp environments
    connectors.push(farcasterMiniApp());

    // Add traditional wallet connectors for browser environments
    if (typeof window !== 'undefined') {
      // MetaMask connector
      connectors.push(metaMask({
        dappMetadata: {
          name: 'PoEP - Proof-of-Existence Passport',
          url: process.env.NEXT_PUBLIC_URL || 'https://peop-mini.vercel.app',
          iconUrl: `${process.env.NEXT_PUBLIC_URL || 'https://peop-mini.vercel.app'}/icon.png`
        }
      }));

      // Coinbase Wallet connector
      connectors.push(coinbaseWallet({
        appName: 'PoEP - Proof-of-Existence Passport',
        appLogoUrl: `${process.env.NEXT_PUBLIC_URL || 'https://peop-mini.vercel.app'}/icon.png`
      }));

      // WalletConnect connector
      const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
      if (projectId) {
        connectors.push(walletConnect({
          projectId,
          metadata: {
            name: 'PoEP - Proof-of-Existence Passport',
            description: 'Your onchain identity, secured by ZK proofs',
            url: process.env.NEXT_PUBLIC_URL || 'https://peop-mini.vercel.app',
            icons: [`${process.env.NEXT_PUBLIC_URL || 'https://peop-mini.vercel.app'}/icon.png`]
          }
        }));
      }
    }

    return createConfig({
      chains: [base, baseSepolia],
      connectors,
      multiInjectedProviderDiscovery: true,
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
