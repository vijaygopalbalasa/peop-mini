'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';
import { ReactNode } from 'react';

/**
 * Providers for PoEP Mini App
 *
 * Follows the official Base Mini Apps pattern:
 * - OnchainKitProvider for Base mainnet integration with MiniKit support
 * - MiniKit is automatically available in Base App context
 * - No need for additional Farcaster SDK providers
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: 'auto',
          theme: 'default',
          name: 'PoEP - Proof-of-Existence Passport',
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}