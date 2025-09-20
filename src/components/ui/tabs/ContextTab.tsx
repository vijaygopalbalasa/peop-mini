"use client";

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

/**
 * ContextTab component displays the current mini app context in JSON format.
 * 
 * This component provides a developer-friendly view of the Farcaster mini app context,
 * including user information, client details, and other contextual data. It's useful
 * for debugging and understanding what data is available to the mini app.
 * 
 * The context includes:
 * - User information (FID, username, display name, profile picture)
 * - Client information (safe area insets, platform details)
 * - Mini app configuration and state
 * 
 * @example
 * ```tsx
 * <ContextTab />
 * ```
 */
export function ContextTab() {
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const [poepStatus, setPoepStatus] = useState<{
    hasPoEP: boolean;
    trustScore: number;
    tokenId: string | null;
    loading: boolean;
  }>({
    hasPoEP: false,
    trustScore: 0,
    tokenId: null,
    loading: false
  });

  // Check PoEP status when wallet connects
  useEffect(() => {
    const checkPoepStatus = async () => {
      if (!address || !isConnected) {
        setPoepStatus(prev => ({
          ...prev,
          hasPoEP: false,
          trustScore: 0,
          tokenId: null,
          loading: false
        }));
        return;
      }

      setPoepStatus(prev => ({ ...prev, loading: true }));
      try {
        const response = await fetch(`/api/check-poep?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          setPoepStatus({
            hasPoEP: data.hasPoEP,
            trustScore: data.trustScore || 0,
            tokenId: data.tokenId,
            loading: false
          });
        }
      } catch (_error) {
        setPoepStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkPoepStatus();
  }, [address, isConnected]);

  return (
    <div className="space-y-6 px-6 w-full max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          App Context
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Your connection details and environment info
        </p>
      </div>

      {/* PoEP Status Information */}
      {isConnected && address ? (
        <div className="card-primary p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-3">
            🛡️ PoEP Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Wallet Address</span>
              <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">PoEP Status</span>
              {poepStatus.loading ? (
                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium">
                  Loading...
                </span>
              ) : (
                <span className={`status-${poepStatus.hasPoEP ? 'success' : 'warning'}`}>
                  {poepStatus.hasPoEP ? 'Active' : 'Not Minted'}
                </span>
              )}
            </div>
            {poepStatus.hasPoEP && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300 text-sm">Trust Score</span>
                  <span className="inline-flex items-center px-2 py-1 bg-success-100 dark:bg-success-900/20 rounded-full text-xs font-medium text-success-700 dark:text-success-300">
                    {poepStatus.trustScore}
                  </span>
                </div>
                {poepStatus.tokenId && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-300 text-sm">Token ID</span>
                    <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 break-all">
                      #{poepStatus.tokenId?.substring(0, 10)}...{poepStatus.tokenId?.substring(poepStatus.tokenId.length - 6)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-3">
            🛡️ PoEP Status
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
            Connect your wallet to view PoEP status
          </p>
        </div>
      )}

      {/* User Information */}
      {context?.user && (
        <div className="card-primary p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-3">
            👤 User Profile
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Display Name</span>
              <span className="font-medium">{context.user.displayName || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Username</span>
              <span className="font-medium">@{context.user.username || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Farcaster ID</span>
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/20 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300">
                {context.user.fid}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Client Information */}
      {context?.client && (
        <div className="card-accent p-6 space-y-4">
          <h3 className="text-lg font-semibold text-accent-800 dark:text-accent-200 mb-3">
            📱 Client Info
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Status</span>
              <span className={`status-${context.client.added ? 'success' : 'warning'}`}>
                {context.client.added ? 'Connected' : 'Not Added'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300 text-sm">Client FID</span>
              <span className="font-medium">{context.client.clientFid || 'Unknown'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Network Information */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-3">
          🌐 Network Info
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Environment</span>
            <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium">
              {process.env.NODE_ENV || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Blockchain</span>
            <span className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/20 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300">
              {process.env.NODE_ENV === 'production' ? 'Base Mainnet' : 'Base Sepolia'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Chain ID</span>
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {process.env.NODE_ENV === 'production' ? '8453' : '84532'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">App URL</span>
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {typeof window !== 'undefined' ? window.location.origin : 'Server'}
            </span>
          </div>
        </div>
      </div>

      {/* PoEP Contract Information */}
      <div className="card-accent p-6 space-y-4">
        <h3 className="text-lg font-semibold text-accent-800 dark:text-accent-200 mb-3">
          📄 Smart Contract
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Contract Address</span>
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS ?
                `${process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS.substring(0, 6)}...${process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS.substring(process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS.length - 4)}`
                : 'Not configured'
              }
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Token Standard</span>
            <span className="inline-flex items-center px-2 py-1 bg-accent-100 dark:bg-accent-900/20 rounded-full text-xs font-medium text-accent-700 dark:text-accent-300">
              ERC-721 (Soul-bound)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Verification</span>
            <span className="inline-flex items-center px-2 py-1 bg-success-100 dark:bg-success-900/20 rounded-full text-xs font-medium text-success-700 dark:text-success-300">
              ZK-SNARK Groth16
            </span>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-3">
          🔧 Technical Details
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This tab shows your current connection status and environment details.
            All data is read-only and used for debugging purposes.
          </p>
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View Raw Context (Developers)
              </summary>
              <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <pre className="font-mono text-xs whitespace-pre-wrap break-words text-neutral-600 dark:text-neutral-400 overflow-x-auto">
                  {JSON.stringify(context, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
} 