"use client";

import { useEffect, useState } from "react";
import sdk from '@farcaster/miniapp-sdk';
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
  { title }: AppProps = { title: "Neynar Starter Kit" }
) {
  // --- Hooks ---
  const [currentTab, setActiveTab] = useState<Tab>(Tab.Home);
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Neynar user hook ---
  const user = context?.user;

  // --- Effects ---
  useEffect(() => {
    async function init() {
      try {
        // sdk.context is a property, not a method
        setContext(sdk.context);
        await sdk.actions.ready();
      } catch (e: any) {
        console.error('Failed to initialize Farcaster SDK', e);
        setError('Error: Could not initialize Farcaster SDK.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // --- Early Returns ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p>Initializing Mini App...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header should be full width */}
      <Header user={user} />

      {/* Main content and footer should be centered */}
      <div className="container py-2 pb-20">
        {/* Main title */}
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

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

