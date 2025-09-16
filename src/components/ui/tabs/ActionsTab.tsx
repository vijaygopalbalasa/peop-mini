'use client';

import { useState, useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Button } from '../Button';
import { SignIn } from '../wallet/SignIn';

/**
 * ActionsTab component for PoEP Mini App
 *
 * Simplified actions tab that works with Base MiniKit.
 * Provides basic user information and authentication.
 */
export function ActionsTab() {
  const { context } = useMiniKit();
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyShareUrl = async () => {
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    setShareUrlCopied(true);
    setTimeout(() => setShareUrlCopied(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 w-full max-w-md mx-auto">
      {/* User Context Information */}
      {context && (
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-3">Base App Context</h3>
          <div className="space-y-2 text-sm">
            {context.user && (
              <div>
                <p className="text-muted-foreground">User: {context.user.displayName || 'Anonymous'}</p>
                {context.user.fid && (
                  <p className="text-muted-foreground">FID: {context.user.fid}</p>
                )}
              </div>
            )}
            {context.client && (
              <div>
                <p className="text-muted-foreground">
                  Client Added: {context.client.added ? 'Yes' : 'No'}
                </p>
                <p className="text-muted-foreground">
                  Client FID: {context.client.clientFid || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication */}
      <div>
        <h3 className="font-semibold mb-3">Authentication</h3>
        <SignIn />
      </div>

      {/* Share functionality */}
      <div className="space-y-3">
        <h3 className="font-semibold">Share PoEP</h3>
        <Button
          onClick={copyShareUrl}
          className="w-full"
          variant="outline"
        >
          {shareUrlCopied ? 'Copied!' : 'Copy App URL'}
        </Button>
      </div>

      {/* App Info */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <h4 className="font-semibold text-blue-800 mb-2">About PoEP</h4>
        <p className="text-blue-700">
          PoEP (Proof-of-Existence Passport) creates a privacy-first identity badge
          using ZK-SNARKs and soul-bound NFTs on Base.
        </p>
      </div>
    </div>
  );
}
