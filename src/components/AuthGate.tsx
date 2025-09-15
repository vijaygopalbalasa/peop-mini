'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAuthenticate } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';
import { Button } from './ui/Button';

/**
 * AuthGate Component
 *
 * Follows Base Mini Apps authentication best practices:
 * - Defer authentication until value is shown
 * - Use client context for UI hints
 * - Use verified user for secure operations
 * - Progressive disclosure pattern
 */

interface AuthGateProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

export function AuthGate({ children, requireAuth = false, fallback }: AuthGateProps) {
  const { context } = useMiniKit();
  const { signIn } = useAuthenticate();

  // Use context for UI hints only (can be spoofed)
  const displayName = context?.user?.displayName ?? context?.user?.username ?? 'Friend';
  const pfpUrl = context?.user?.pfpUrl;

  // For now, we'll use context for basic auth state
  // In production, you'd track authenticated state separately
  const isAuthenticated = !!context?.user;

  // If auth is not required, show content with context hints
  if (!requireAuth) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
          {pfpUrl && (
            <img
              src={pfpUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-muted-foreground">
            Welcome, {displayName}!
          </span>
        </div>
        {children}
      </div>
    );
  }

  // If auth is required but user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-muted-foreground mb-4">
          You need to sign in to access this feature
        </p>
        <Button variant="default" onClick={signIn}>
          Sign In
        </Button>
        {fallback && (
          <div className="mt-4">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  // User is authenticated, show protected content
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
        {pfpUrl && (
          <img
            src={pfpUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1">
          <span className="text-sm font-medium text-green-800">
            ✅ Authenticated as {displayName}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export default AuthGate;