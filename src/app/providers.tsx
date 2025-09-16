'use client';

import { ReactNode } from 'react';
import { MiniKitContextProvider } from './providers/MiniKitContextProvider';
import WagmiProvider from '~/components/providers/WagmiProvider';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export function Providers({ children }: { children: ReactNode }) {
  // Solana network setup
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WagmiProvider>
          <MiniKitContextProvider>
            {children}
          </MiniKitContextProvider>
        </WagmiProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}