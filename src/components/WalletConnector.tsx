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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading wallet...</p>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="space-y-3 text-center">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800 font-semibold">✅ Wallet Connected</p>
          <p className="text-sm text-green-600">{truncateAddress(address)}</p>
        </div>

        <Button
          onClick={() => disconnect()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Connecting wallet...</p>
      </div>
    );
  }

  // Show different connection options based on environment
  if (context?.user?.fid) {
    // In Farcaster environment
    return (
      <div className="space-y-3">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Connect your wallet to create your PoEP</p>
        </div>

        {connectors.map((connector, index) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isConnecting}
            className={`w-full px-4 py-3 rounded-lg ${
              index === 0
                ? 'bg-purple-600 hover:bg-purple-700 text-white' // Farcaster connector
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {connector.name === 'Farcaster MiniApp'
              ? 'Connect Farcaster Wallet'
              : `Connect ${connector.name}`
            }
          </Button>
        ))}

        {error && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm">
              Connection failed: {error.message}
            </p>
          </div>
        )}
      </div>
    );
  }

  // In browser environment
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">Connect your wallet to create your PoEP</p>
      </div>

      {connectors
        .filter(connector => connector.name !== 'Farcaster MiniApp') // Hide Farcaster connector in browser
        .map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg"
          >
            Connect {connector.name}
          </Button>
        ))
      }

      {connectors.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 text-sm">
            No wallet connectors available. Please ensure you have MetaMask, Coinbase Wallet, or similar installed.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-red-800 text-sm">
            Connection failed: {error.message}
          </p>
        </div>
      )}
    </div>
  );
}