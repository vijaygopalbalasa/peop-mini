'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { getTrustScore } from '~/lib/contract';

export default function TrustScoreChecker() {
  const [address, setAddress] = useState('');
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const checkTrustScore = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    if (!isAddress(address)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setIsLoading(true);
    setError('');
    setTrustScore(null);

    try {
      const score = await getTrustScore(address as `0x${string}`);
      setTrustScore(score);
    } catch (_err) {
      setError('Failed to fetch trust score');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Check Trust Score</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Enter Ethereum address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
        />
        <button
          onClick={checkTrustScore}
          disabled={isLoading}
          className="btn btn-primary w-full disabled:bg-gray-400"
        >
          {isLoading ? 'Checking...' : 'Check Trust Score'}
        </button>
        
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        
        {trustScore !== null && (
          <div className="text-center p-3 bg-white dark:bg-neutral-900 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">Trust Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(trustScore)}`}>
              {trustScore}/100
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
