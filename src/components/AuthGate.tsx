'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';
import { Button } from './ui/Button';

/**
 * AuthGate Component
 *
 * Follows Base Mini Apps authentication best practices:
 * - Defer authentication until value is shown
 * - Use client context for UI hints only
 * - Progressive disclosure pattern
 * - Wallet-optional flows with clear value moments
 */

interface AuthGateProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
  valueMessage?: string;
}

export function AuthGate({ children, requireAuth = false, fallback, valueMessage }: AuthGateProps) {
  const { context } = useMiniKit();

  // Use context for UI hints only (can be spoofed by non-official hosts)
  const displayName = context?.user?.displayName ?? context?.user?.username ?? 'Friend';
  const pfpUrl = context?.user?.pfpUrl;

  // Check if user context exists (for UI hints only)
  const hasUserContext = !!context?.user;

  // If auth is not required, show content with personalized context hints
  if (!requireAuth) {
    return (
      <div>
        {hasUserContext && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            {pfpUrl && (
              <img
                src={pfpUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm font-medium text-blue-800">
              👋 Welcome, {displayName}!
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  // If auth is required, show value-first prompt
  if (!hasUserContext) {
    return (
      <div className="text-center p-6 bg-card rounded-lg border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Ready to Create Your PoEP?</h3>
          <p className="text-muted-foreground mb-4">
            {valueMessage || 'Connect to mint your soul-bound identity NFT on Base'}
          </p>
        </div>

        {/* Show value proposition before auth */}
        <div className="bg-muted p-4 rounded-lg mb-4 text-left">
          <h4 className="font-medium mb-2">What you&apos;ll get:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Privacy-first biometric verification</li>
            <li>• Zero-knowledge proof of humanity</li>
            <li>• Soul-bound NFT on Base mainnet</li>
            <li>• Trust score that grows with activity</li>
          </ul>
        </div>

        <Button variant="default" className="w-full mb-2">
          Get Started
        </Button>

        {fallback && (
          <div className="mt-4">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  // User has context, show authenticated content
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        {pfpUrl && (
          <img
            src={pfpUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1">
          <span className="text-sm font-medium text-green-800">
            ✅ Ready to go, {displayName}!
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export default AuthGate;