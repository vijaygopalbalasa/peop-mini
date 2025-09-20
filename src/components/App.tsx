"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Header } from '~/components/ui/Header';
import { Footer } from '~/components/ui/Footer';
import { HomeTab, ActionsTab, ContextTab, WalletTab } from '~/components/ui/tabs';
import { USE_WALLET } from '~/lib/constants';

// --- Types ---
export enum Tab {
  Home = "home",
  Actions = "actions",
  Context = "context",
  Wallet = "wallet",
}

export interface AppProps {
  title?: string;
}

/**
 * App component serves as the main container for the mini app interface.
 * 
 * This component orchestrates the overall mini app experience by:
 * - Managing tab navigation and state
 * - Handling Farcaster mini app initialization
 * - Coordinating wallet and context state
 * - Providing error handling and loading states
 * - Rendering the appropriate tab content based on user selection
 * 
 * The component integrates with the Neynar SDK for Farcaster functionality
 * and Wagmi for wallet management. It provides a complete mini app
 * experience with multiple tabs for different functionality areas.
 * 
 * Features:
 * - Tab-based navigation (Home, Actions, Context, Wallet)
 * - Farcaster mini app integration
 * - Wallet connection management
 * - Error handling and display
 * - Loading states for async operations
 * 
 * @param props - Component props
 * @param props.title - Optional title for the mini app (defaults to "Neynar Starter Kit")
 * 
 * @example
 * ```tsx
 * <App title="My Mini App" />
 * ```
 */
export default function App(
  { title }: AppProps = { title: "PoEP - Proof-of-Existence Passport" }
) {
  // --- Hooks ---
  const [currentTab, setActiveTab] = useState<Tab>(Tab.Home);
  const [mounted, setMounted] = useState(false);

  // MiniKit integration
  const { context } = useMiniKit();
  const user = context?.user;
  const client = context?.client;

  // --- Client-side mounting ---
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Early Returns ---
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p>Loading PoEP...</p>
        </div>
      </div>
    );
  }


  // --- Render ---
  return (
    <div
      style={{
        paddingTop: client?.safeAreaInsets?.top ?? 0,
        paddingBottom: client?.safeAreaInsets?.bottom ?? 0,
        paddingLeft: client?.safeAreaInsets?.left ?? 0,
        paddingRight: client?.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header should be full width */}
      <Header user={user} />

      {/* Main content and footer should be centered */}
      <div className="container py-2 pb-24">
        {/* Main title - Only show if not PoEP default */}
        {title !== "PoEP - Proof-of-Existence Passport" && (
          <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>
        )}

        {/* Tab content rendering */}
        {currentTab === Tab.Home && <HomeTab />}
        {currentTab === Tab.Actions && <ActionsTab />}
        {currentTab === Tab.Context && <ContextTab />}
        {currentTab === Tab.Wallet && <WalletTab />}

        {/* Footer with navigation */}
        <Footer activeTab={currentTab as Tab} setActiveTab={setActiveTab} showWallet={USE_WALLET} />
      </div>
    </div>
  );
}

