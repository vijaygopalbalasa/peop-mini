'use client';
import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'wagmi/chains';

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  // Use Sepolia for testing, mainnet for production
  const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={chain}
      config={{
        appearance: {
          mode: 'auto',
        },
      }}
      miniKit={{
        enabled: true,
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}