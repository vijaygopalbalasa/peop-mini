'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { POEP_CONTRACT_ABI } from '~/lib/constants';
import { POEP_CONTRACT_ADDRESS } from '~/lib/config';
import { generateZKProof } from '~/lib/contract';
import { base, baseSepolia } from 'wagmi/chains';

export function MintButton({ onMintSuccess }: { onMintSuccess?: () => void }) {
  const [snarkJsState, setSnarkJsState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const { data: hash, writeContract, isPending: isSubmitting, error } = useWriteContract();

  useEffect(() => {
    console.log('Checking for snarkjs...');
    if ((window as any).snarkjs) {
      console.log('snarkjs already loaded.');
      setSnarkJsState('loaded');
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).snarkjs) {
        console.log('snarkjs loaded successfully.');
        setSnarkJsState('loaded');
        clearInterval(interval);
        clearTimeout(timeout);
      }
    }, 500);

    const timeout = setTimeout(() => {
      if (snarkJsState === 'loading') {
        console.error('snarkjs loading timed out.');
        setSnarkJsState('failed');
        clearInterval(interval);
      }
    }, 10000); // 10-second timeout

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [snarkJsState]);

  async function submit() {
    const explorerBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://basescan.org/tx/'
        : 'https://sepolia.basescan.org/tx/';
    toast.loading('Preparing transaction...', { id: 'mint-toast' });
    try {
      const { pA, pB, pC, nullifier } = await generateZKProof();
      writeContract({
        address: POEP_CONTRACT_ADDRESS,
        abi: POEP_CONTRACT_ABI,
        functionName: 'mint',
        args: [pA, pB, pC, nullifier],
        chain: process.env.NODE_ENV === 'production' ? base : baseSepolia,
      });
    } catch (err: any) {
      toast.error(<b>Error: {err.message}</b>, { id: 'mint-toast' });
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    const explorerBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://basescan.org/tx/'
        : 'https://sepolia.basescan.org/tx/';
        
    if (hash) {
      toast.loading(
        <span>
          Tx sent. View on explorer:{' '}
          <a className="underline" href={`${explorerBaseUrl}${hash}`} target="_blank" rel="noreferrer">
            {hash.slice(0, 10)}...
          </a>
        </span>,
        { id: 'mint-toast' }
      );
    }
    if (isConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'mint-toast' });
    }

    if (isConfirmed) {
      toast.success(
        <span>
          <b>Passport Minted!</b>{' '}
          <a className="underline" href={`${explorerBaseUrl}${hash}`} target="_blank" rel="noreferrer">
            View tx
          </a>
        </span>,
        { id: 'mint-toast', duration: 8000 }
      );
      onMintSuccess?.();
    }

    if (error) {
      toast.error(<b>Error: {error.message}</b>, { id: 'mint-toast' });
    }
  }, [hash, isConfirming, isConfirmed, error, onMintSuccess]);

  return (
    <div className="mt-4">
      <button 
        className="btn btn-primary w-full disabled:bg-gray-400"
        disabled={snarkJsState !== 'loaded' || isSubmitting || isConfirming}
        onClick={submit}
      >
        {snarkJsState === 'loading'
          ? 'Loading ZK circuits...'
          : snarkJsState === 'failed'
          ? 'Load failed. Refresh.'
          : isSubmitting
          ? 'Check Wallet...'
          : isConfirming
          ? 'Confirming...'
          : 'Mint Your Passport'}
      </button>
    </div>
  );
}
