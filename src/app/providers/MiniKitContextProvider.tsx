'use client';
import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

// Environment validation for OnchainKit
const validateOnchainKitEnvironment = () => {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

  if (!apiKey) {
    console.warn('NEXT_PUBLIC_ONCHAINKIT_API_KEY not configured - some features may be limited');
  }

  return apiKey;
};

interface MiniKitContextProviderProps {
  children: ReactNode;
}

export function MiniKitContextProvider({ children }: MiniKitContextProviderProps) {
  const apiKey = validateOnchainKitEnvironment();

  return (
    <OnchainKitProvider
      apiKey={apiKey}
      chain={base}
      config={{
        appearance: {
          mode: 'auto',
          theme: 'base',
        },
        paymaster: {
          url: process.env.NEXT_PUBLIC_PAYMASTER_URL,
        },
      }}
      miniKit={{
        enabled: true,
        inFrame: typeof window !== 'undefined' && window.parent !== window,
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}