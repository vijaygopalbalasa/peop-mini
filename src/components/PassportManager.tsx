'use client';

import { useAccount, useWatchContractEvent } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import { hasPassport } from '~/lib/contract';
import { MintButton } from '~/components/MintButton';
import { POEP_CONTRACT_ABI } from '~/lib/constants';
import { POEP_CONTRACT_ADDRESS } from '~/lib/config';

export default function PassportManager() {
  const { address } = useAccount();
  const [hasPoep, setHasPoep] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPassport = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const userHasPassport = await hasPassport(address);
      setHasPoep(userHasPassport);
    } catch (error) {
      console.error("Failed to check for passport:", error);
      setHasPoep(false); // Assume no passport on error
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    checkPassport();
  }, [checkPassport]);

  // Listen for on-chain mint event to refresh status immediately after mint
  useWatchContractEvent({
    address: POEP_CONTRACT_ADDRESS,
    abi: POEP_CONTRACT_ABI,
    eventName: 'PassportMinted',
    enabled: !!address,
    onLogs: (logs) => {
      // If the mint event is for the connected user, mark as having a passport
      const mintedForUser = logs?.some((log: any) =>
        (log.args?.user as string)?.toLowerCase() === address?.toLowerCase()
      );
      if (mintedForUser) {
        console.log('PassportMinted event received for current user. Refetching status...');
        checkPassport(); // Directly re-check passport status
      }
    },
  });

  if (isLoading) {
    return (
      <div className="card p-4 text-center">
        <div className="mx-auto mb-2 h-6 w-6 spinner" />
        <div className="text-sm text-gray-700 dark:text-gray-300">Loading Passport Status...</div>
      </div>
    );
  }

  if (hasPoep) {
    return (
      <div className="card p-5 text-center border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-900/20">
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">Passport Found!</h2>
        <p className="text-green-700 dark:text-green-400 text-sm">You are a verified member of the PoEP community.</p>
      </div>
    );
  }

  return (
    <div className="card p-5 text-center">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Create Your Proof-of-Existence Passport</h2>
      <p className="mb-4 text-gray-700 dark:text-gray-300">Mint your unique, soul-bound NFT to establish your onchain identity.</p>
      <MintButton onMintSuccess={checkPassport} />
    </div>
  );
}
