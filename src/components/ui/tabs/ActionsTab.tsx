'use client';

import { useState, useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Button } from '../Button';

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
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Quick Actions
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Manage your PoEP and connect your wallet
        </p>
      </div>

      {/* Primary Actions */}
      <div className="space-y-4">
        {/* Share PoEP */}
        <div className="card-primary p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔗</span>
            </div>
            <div>
              <h3 className="font-semibold text-primary-800 dark:text-primary-200">Share PoEP</h3>
              <p className="text-sm text-primary-600 dark:text-primary-300">Invite others to create their passport</p>
            </div>
          </div>
          <Button
            onClick={copyShareUrl}
            className="w-full btn-primary"
          >
            {shareUrlCopied ? '✅ Copied to Clipboard!' : '📋 Copy App URL'}
          </Button>
        </div>

        {/* Wallet Connection */}
        <div className="card-accent p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👛</span>
            </div>
            <div>
              <h3 className="font-semibold text-accent-800 dark:text-accent-200">Wallet Access</h3>
              <p className="text-sm text-accent-600 dark:text-accent-300">Use the Wallet tab to connect your wallet</p>
            </div>
          </div>
          <div className="text-center text-sm text-accent-600 dark:text-accent-300">
            Navigate to the Wallet tab to connect MetaMask or Coinbase Wallet
          </div>
        </div>
      </div>

      {/* User Status */}
      {context?.user && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👤</span>
            </div>
            <div>
              <h3 className="font-semibold">Your Profile</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Current connection status</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Display Name</span>
              <span className="font-medium">{context.user.displayName || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Status</span>
              <span className="status-success">Connected</span>
            </div>
            {context.client && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Client</span>
                <span className={`status-${context.client.added ? 'success' : 'warning'}`}>
                  {context.client.added ? 'Added to App' : 'Not Added'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">ℹ️</span>
          </div>
          <div>
            <h3 className="font-semibold">About PoEP</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Learn about this application</p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
          <p>
            PoEP (Proof-of-Existence Passport) creates a privacy-first digital identity
            using Zero-Knowledge proofs and soul-bound NFTs on the Base blockchain.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <span className="font-medium">Privacy</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">ZK-SNARK protected</p>
            </div>
            <div>
              <span className="font-medium">Identity</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Soul-bound NFT</p>
            </div>
            <div>
              <span className="font-medium">Network</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Base blockchain</p>
            </div>
            <div>
              <span className="font-medium">Unique</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">One per wallet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
