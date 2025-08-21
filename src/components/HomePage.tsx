'use client';

import { useMiniApp } from '@neynar/react';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import PassportManager from '~/components/PassportManager';
import TrustScoreChecker from '~/components/TrustScoreChecker';
import WalletWrapper from '~/components/WalletWrapper';
import Hero from '~/components/Hero';
import Footer from '~/components/Footer';
import { Toaster } from 'react-hot-toast';

function MiniAppHome() {
  const { isSDKLoaded } = useMiniApp();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSDKLoaded) return;
    let cancelled = false;
    const markReady = async () => {
      try {
        await sdk.context;
        if (!cancelled) await sdk.actions.ready();
      } catch {
        setTimeout(async () => {
          try {
            if (!cancelled) await sdk.actions.ready();
          } catch { }
        }, 300);
      }
    };
    markReady();
    return () => {
      cancelled = true;
    };
  }, [isSDKLoaded]);

  if (!mounted || !isSDKLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🪐</div>
          <p>Loading PoEP Mini App...</p>
        </div>
      </div>
    );
  }

  return (
    <MainContent addressConnected={!!address} />
  );
}

function BrowserHome() {
  const { address } = useAccount();
  return <MainContent addressConnected={!!address} />;
}

function MainContent({ addressConnected }: { addressConnected: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <Toaster />
      <div className="container-wide w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-300 dark:to-blue-300">
            Proof-of-Existence Passport
          </h1>
          <p className="text-gray-700 dark:text-gray-300">Your onchain identity, secured by ZK proofs</p>
        </div>
        <Hero />
        <div className="mt-6">
          {addressConnected ? (
            <PassportManager />
          ) : (
            <WalletWrapper />
          )}
        </div>
        <div className="mt-8">
          <TrustScoreChecker />
        </div>
        <Footer />
      </div>
    </main>
  );
}

export default function HomePage() {
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMiniApp(
      typeof window !== 'undefined' && typeof (window as any).farcaster !== 'undefined'
    );
  }, []);

  if (isMiniApp === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🪐</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isMiniApp ? <MiniAppHome /> : <BrowserHome />;
}
