'use client';

import { MiniAppProvider } from '@neynar/react';
import { SafeFarcasterSolanaProvider } from '~/components/providers/SafeFarcasterSolanaProvider';
import WagmiProvider from '~/components/providers/WagmiProvider';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';
import { useEffect } from 'react';
import { useMiniApp } from '@neynar/react';
import { sdk } from '@farcaster/miniapp-sdk';

function MiniAppReady() {
  const { isSDKLoaded } = useMiniApp();
  useEffect(() => {
    if (!isSDKLoaded) return;
    let cancelled = false;
    const run = async () => {
      try {
        await sdk.context;
        if (!cancelled) await sdk.actions.ready();
      } catch {
        setTimeout(async () => {
          try {
            if (!cancelled) await sdk.actions.ready();
          } catch {}
        }, 300);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isSDKLoaded]);
  return null;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const solanaEndpoint =
    process.env.SOLANA_RPC_ENDPOINT || 'https://solana-rpc.publicnode.com';
  const isMiniApp =
    typeof window !== 'undefined' && typeof (window as any).farcaster !== 'undefined';
  return (
    <WagmiProvider>
      {isMiniApp ? (
        <MiniAppProvider
          analyticsEnabled={ANALYTICS_ENABLED}
          backButtonEnabled={true}
          returnUrl={RETURN_URL}
        >
          <MiniAppReady />
          <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
            {children}
          </SafeFarcasterSolanaProvider>
        </MiniAppProvider>
      ) : (
        <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
          {children}
        </SafeFarcasterSolanaProvider>
      )}
    </WagmiProvider>
  );
}
