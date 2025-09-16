'use client';

import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useMemo, ReactNode } from 'react';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

// Environment validation
const validateEnvironment = () => {
  const url = process.env.NEXT_PUBLIC_URL;
  const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

  if (!url) {
    console.warn('NEXT_PUBLIC_URL not configured, using fallback');
  }

  if (!projectId) {
    console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID not configured, WalletConnect will be disabled');
  }

  return { url: url || 'https://peop-mini.vercel.app', projectId };
};

// Singleton pattern to prevent multiple QueryClient instances
let queryClientInstance: QueryClient | null = null;
const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
        },
      },
    });
  }
  return queryClientInstance;
};

// Singleton pattern to prevent multiple wagmi config instances
let wagmiConfigInstance: ReturnType<typeof createConfig> | null = null;

const getWagmiConfig = () => {
  if (wagmiConfigInstance) {
    return wagmiConfigInstance;
  }

  const { url, projectId } = validateEnvironment();
  const connectors = [];

  try {
    // Always add Farcaster MiniApp connector first
    connectors.push(farcasterMiniApp());

    // Add browser wallet connectors only in browser environment
    if (typeof window !== 'undefined') {
      // MetaMask connector
      connectors.push(metaMask({
        dappMetadata: {
          name: 'PoEP - Proof-of-Existence Passport',
          url,
          iconUrl: `${url}/icon.png`
        }
      }));

      // Coinbase Wallet connector
      connectors.push(coinbaseWallet({
        appName: 'PoEP - Proof-of-Existence Passport',
        appLogoUrl: `${url}/icon.png`,
        enableMobileWalletLink: true
      }));

      // WalletConnect connector (only if project ID is available)
      if (projectId) {
        connectors.push(walletConnect({
          projectId,
          metadata: {
            name: 'PoEP - Proof-of-Existence Passport',
            description: 'Your onchain identity, secured by ZK proofs',
            url,
            icons: [`${url}/icon.png`]
          },
          showQrModal: true
        }));
      }
    }

    wagmiConfigInstance = createConfig({
      chains: [baseSepolia, base], // Sepolia first for testing
      connectors,
      multiInjectedProviderDiscovery: false, // Prevent discovery conflicts
      ssr: true,
      transports: {
        [base.id]: http('https://mainnet.base.org'),
        [baseSepolia.id]: http('https://sepolia.base.org'),
      },
    });

    return wagmiConfigInstance;
  } catch (error) {
    console.error('Failed to create wagmi config:', error);
    throw new Error('Wallet configuration failed to initialize');
  }
};

interface WagmiProviderProps {
  children: ReactNode;
}

export default function Provider({ children }: WagmiProviderProps) {
  // Use the singleton config - only create once
  const config = useMemo(() => getWagmiConfig(), []);
  const queryClient = useMemo(() => getQueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
