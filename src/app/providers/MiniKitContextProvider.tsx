'use client';
import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
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