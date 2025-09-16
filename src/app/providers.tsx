'use client';

import { ReactNode } from 'react';
import { MiniKitContextProvider } from './providers/MiniKitContextProvider';
import WagmiProvider from '~/components/providers/WagmiProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniKitContextProvider>
      <WagmiProvider>
        {children}
      </WagmiProvider>
    </MiniKitContextProvider>
  );
}