'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Button } from './ui/Button';
import { truncateAddress } from '~/lib/truncateAddress';
import { useEffect, useState } from 'react';

interface WalletConnectorProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function WalletConnector({ onConnectionChange }: WalletConnectorProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { context } = useMiniKit();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  // Auto-connect in Farcaster environment
  useEffect(() => {
    if (mounted && context?.user?.fid && !isConnected && !isConnecting && connectors.length > 0) {
      // Try to auto-connect with Farcaster connector
      const farcasterConnector = connectors.find(
        connector => connector.name === 'Farcaster MiniApp'
      );
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [mounted, context?.user?.fid, isConnected, isConnecting, connectors, connect]);

  if (!mounted) {
    return (
      <div className="text-center">
        <div className="spinner w-6 h-6 mx-auto mb-2"></div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading wallet...</p>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <div className="card-primary p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-2xl">
            ✅
          </div>
          <p className="font-semibold text-primary-800 dark:text-primary-200 mb-2">Wallet Connected</p>
          <p className="text-sm text-primary-600 dark:text-primary-300 font-mono">{truncateAddress(address)}</p>
        </div>

        <Button
          onClick={() => disconnect()}
          className="w-full btn-secondary"
        >
          🔌 Disconnect Wallet
        </Button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="text-center">
        <div className="spinner w-6 h-6 mx-auto mb-2"></div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Connecting wallet...</p>
      </div>
    );
  }

  // Show different connection options based on environment
  if (context?.user?.fid) {
    // In Farcaster environment
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Connect your wallet to create your PoEP</p>
        </div>

        {connectors.map((connector, index) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isConnecting}
            className={`w-full ${
              index === 0
                ? 'btn-primary' // Farcaster connector
                : 'btn-secondary'
            }`}
          >
            {connector.name === 'Farcaster MiniApp'
              ? '🟣 Connect Farcaster Wallet'
              : `🔗 Connect ${connector.name}`
            }
          </Button>
        ))}

        {error && (
          <div className="card p-4 border border-error-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-error-500 rounded-full"></div>
              <p className="text-error-600 dark:text-error-400 text-sm">
                Connection failed: {error.message}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // In browser environment
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Connect your wallet to create your PoEP</p>
      </div>

      {connectors
        .filter(connector => connector.name !== 'Farcaster MiniApp') // Hide Farcaster connector in browser
        .map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isConnecting}
            className="w-full btn-primary"
          >
            {connector.name === 'Coinbase Wallet' ? '🔵' :
             connector.name === 'MetaMask' ? '🦊' : '🔗'} Connect {connector.name}
          </Button>
        ))
      }

      {connectors.length === 0 && (
        <div className="card p-4 border border-warning-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
            <p className="text-warning-600 dark:text-warning-400 text-sm">
              No wallet connectors available. Please ensure you have MetaMask, Coinbase Wallet, or similar installed.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-4 border border-error-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-error-500 rounded-full"></div>
            <p className="text-error-600 dark:text-error-400 text-sm">
              Connection failed: {error.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}