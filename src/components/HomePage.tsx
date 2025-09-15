'use client';

import { useMiniKit } from '@farcaster/miniapp-sdk';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import PassportManager from '~/components/PassportManager';
import TrustScoreChecker from '~/components/TrustScoreChecker';
import AuthGate from '~/components/AuthGate';
import Hero from '~/components/Hero';
import Footer from '~/components/Footer';
import { Toaster } from 'react-hot-toast';

/**
 * HomePage Component for PoEP Mini App
 *
 * Follows Base Mini Apps best practices:
 * - Progressive disclosure (show value before auth)
 * - MiniKit integration for Base App context
 * - Clean UX with minimal friction
 */
function MiniAppHome() {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PoEP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          className: 'bg-card border shadow-lg',
        }}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - No auth required, show value first */}
        <Hero />

        {/* Context Information */}
        {context && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Base App Context</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Client: {context.client?.name || 'Unknown'}</p>
              <p>Version: {context.client?.version || 'Unknown'}</p>
              {context.user && (
                <p>User: {context.user.displayName || 'Anonymous'}</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Progressive disclosure */}
        <div className="space-y-8">
          {/* Trust Score Checker - No auth required */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Check Trust Score</h2>
            <AuthGate requireAuth={false}>
              <TrustScoreChecker />
            </AuthGate>
          </section>

          {/* Passport Manager - Auth required for minting */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Your PoEP Passport</h2>
            <AuthGate
              requireAuth={true}
              fallback={
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet to view your passport status
                  </p>
                </div>
              }
            >
              <PassportManager />
            </AuthGate>
          </section>

          {/* Wallet Information */}
          {address && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Wallet Connected</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Connected</p>
                <p className="text-green-700 text-sm font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return <MiniAppHome />;
}