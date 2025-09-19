"use client";

import { useState, useRef, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel, TransactionStatusAction } from '@coinbase/onchainkit/transaction';
import { encodeFunctionData } from 'viem';
import { Button } from '../Button';
import { WalletConnector } from '../../WalletConnector';
import { generateFaceHash, generateZKProof, type ZKProofResult } from '~/lib/zkProof';
import { generateZKProof as contractGenerateZKProof } from '~/lib/contract';
import { POEP_CONTRACT_ABI } from '~/lib/constants';
import { POEP_CONTRACT_ADDRESS } from '~/lib/config';
import { base } from 'wagmi/chains';

/**
 * HomeTab component for PoEP (Proof-of-Existence Passport)
 *
 * This component implements the main PoEP functionality:
 * 1. Camera capture for selfie
 * 2. ZK-SNARK proof generation
 * 3. Soul-bound NFT minting
 *
 * Features:
 * - Privacy-first camera capture (never leaves device)
 * - Browser-side ZK proof generation
 * - Base mainnet soul-bound NFT
 * - Trust score tracking
 */

enum PoEPStep {
  Welcome = 'welcome',
  Camera = 'camera',
  Processing = 'processing',
  Success = 'success',
  Error = 'error'
}

export function HomeTab() {
  const [currentStep, setCurrentStep] = useState<PoEPStep>(PoEPStep.Welcome);
  const [_isCapturing, _setIsCapturing] = useState(false);
  const [_capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_zkProof, setZkProof] = useState<ZKProofResult | null>(null);
  const [userTrustScore, setUserTrustScore] = useState<number>(0);
  const [hasExistingPassport, setHasExistingPassport] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Base MiniKit integration
  const { context } = useMiniKit();
  const _user = context?.user;

  // Detect if we're in Farcaster environment
  const isInFarcaster = Boolean(context?.user?.fid);

  // Wallet integration
  const { address, isConnected, chain } = useAccount();

  const { switchChain } = useSwitchChain();

  // Transaction state management for OnchainKit
  const [contractCallData, setContractCallData] = useState<{
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
  } | null>(null);

  // Helper function to get explorer URLs
  const getExplorerUrls = (tokenId: string | null, transactionHash: string | null) => {
    const baseUrl = 'https://basescan.org'; // Always use mainnet explorer

    return {
      token: tokenId && POEP_CONTRACT_ADDRESS ? `${baseUrl}/nft/${POEP_CONTRACT_ADDRESS}/${tokenId}` : null,
      transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
      contract: POEP_CONTRACT_ADDRESS ? `${baseUrl}/address/${POEP_CONTRACT_ADDRESS}` : null
    };
  };

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update wallet connection state
  useEffect(() => {
    setWalletConnected(isConnected);
  }, [isConnected]);

  // Check network and switch if needed when wallet connects
  useEffect(() => {
    const checkAndSwitchNetwork = async () => {
      if (address && isConnected && chain && !isInFarcaster) {
        const requiredChain = base; // Always use Base mainnet for production

        if (chain.id !== requiredChain.id) {
          try {
            console.log(`Switching from ${chain.name} (${chain.id}) to ${requiredChain.name} (${requiredChain.id})`);
            await switchChain({ chainId: requiredChain.id });
          } catch (error) {
            console.warn('Auto network switch failed:', error);
          }
        }
      }
    };

    checkAndSwitchNetwork();
  }, [address, isConnected, chain, isInFarcaster, switchChain]);

  // Check for existing passport when component mounts or address changes
  useEffect(() => {
    const checkExistingPassport = async () => {
      if (address && isConnected) {
        try {
          const response = await fetch(`/api/check-poep?address=${address}`);
          if (response.ok) {
            const data = await response.json();
            setHasExistingPassport(data.hasPoEP);
            setUserTrustScore(data.trustScore || 0);
            setTokenId(data.tokenId);
          }
        } catch (_error) {
          setHasExistingPassport(false);
          setUserTrustScore(0);
          setTokenId(null);
        }
      } else {
        // Reset when wallet disconnected
        setHasExistingPassport(false);
        setUserTrustScore(0);
        setTokenId(null);
      }
    };

    checkExistingPassport();
  }, [address, isConnected]);



  const startCamera = async () => {
    try {
      setError(null);
      setCurrentStep(PoEPStep.Camera);

      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }


      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {

      let errorMessage = 'Camera access denied. ';

      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the requested settings.';
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Camera access blocked for security reasons. Try using HTTPS.';
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error'}`;
      }

      setError(errorMessage);
      setCurrentStep(PoEPStep.Error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Process the image for ZK proof
      processImage(imageData);
    }
  };

  const processImage = async (imageData: string) => {
    setCurrentStep(PoEPStep.Processing);
    setError(null);

    try {

      // Step 1: Convert image to face hash
      let faceHash: string;
      try {
        faceHash = await generateFaceHash(imageData);
      } catch (err) {
        throw new Error(`Face analysis failed: ${(err as Error).message}`);
      }

      // Step 2: Generate ZK proof
      let proof: ZKProofResult;
      try {
        proof = await generateZKProof(faceHash);
        setZkProof(proof);
      } catch (err) {
        throw new Error(`ZK proof generation failed: ${(err as Error).message}`);
      }

      // Step 3: Prepare transaction data for OnchainKit
      try {
        await prepareTransaction(proof);
      } catch (err) {
        throw new Error(`Transaction preparation failed: ${(err as Error).message}`);
      }
    } catch (err: any) {

      let errorMessage = 'Failed to create PoEP';
      if (err.message) {
        errorMessage = err.message;
      }

      // Add helpful suggestions based on error type
      if (err.message?.includes('Camera')) {
        errorMessage += '\n\nTip: Please allow camera permissions and ensure good lighting.';
      } else if (err.message?.includes('ZK proof')) {
        errorMessage += '\n\nTip: This may be due to network issues. Please check your connection and try again.';
      } else if (err.message?.includes('minting')) {
        errorMessage += '\n\nTip: Check your wallet connection and ensure you have enough ETH for gas fees.';
      }

      setError(errorMessage);
      setCurrentStep(PoEPStep.Error);
    }
  };


  const prepareTransaction = async (proof: ZKProofResult) => {
    try {
      // Generate contract-compatible ZK proof using the same face hash
      if (!address) {
        throw new Error('Wallet address is required for contract proof generation');
      }

      // Check and switch network if needed
      if (!isInFarcaster && chain) {
        const requiredChain = base; // Always use Base mainnet

        if (chain.id !== requiredChain.id) {
          try {
            await switchChain({ chainId: requiredChain.id });
          } catch (_error: any) {
            throw new Error(`Please switch to ${requiredChain.name} network in your wallet`);
          }
        }
      }

      const contractProof = await contractGenerateZKProof(proof.faceHash, proof.nonce, address);

      // Get contract address from config (environment-aware)
      if (!POEP_CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured for current environment');
      }

      // Prepare transaction data for OnchainKit Transaction component
      const data = encodeFunctionData({
        abi: POEP_CONTRACT_ABI,
        functionName: 'mint',
        args: [
          contractProof.pA,
          contractProof.pB,
          contractProof.pC,
          BigInt(contractProof.nullifier)
        ]
      });

      setContractCallData({
        to: POEP_CONTRACT_ADDRESS,
        data,
        value: '0',
      });

      // Move to processing step to show Transaction component
      setCurrentStep(PoEPStep.Processing);
    } catch (error: any) {
      if (error.message?.includes('User rejected')) {
        throw new Error('Transaction was cancelled. Please try again and approve the transaction.');
      } else if (error.message?.includes('Already minted') || error.message?.includes('AlreadyMinted')) {
        setHasExistingPassport(true);
        setCurrentStep(PoEPStep.Success);
        return;
      } else {
        throw error;
      }
    }
  };

  const resetFlow = () => {
    setCurrentStep(PoEPStep.Welcome);
    setCapturedImage(null);
    setError(null);
    setContractCallData(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const refreshTrustScore = async () => {
    if (!address || !isConnected) return;

    try {
      const response = await fetch(`/api/check-poep?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserTrustScore(data.trustScore || 0);
        setHasExistingPassport(data.hasPoEP);
        setTokenId(data.tokenId);
      }
    } catch (_error) {
      // Silent fail - user can try again
    }
  };

  // Handle successful transaction
  const handleTransactionSuccess = async (txHash: string) => {
    setTransactionHash(txHash);

    // Set initial state immediately for better UX
    setHasExistingPassport(true);
    setUserTrustScore(1); // Start with contract's initial score of 1
    setCurrentStep(PoEPStep.Success);

    // Background verification - get real score from blockchain
    setTimeout(async () => {
      try {
        // Wait for blockchain confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));

        const response = await fetch(`/api/check-poep?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasPoEP) {
            // Update with actual trust score from blockchain
            setUserTrustScore(data.trustScore || 1);
            setTokenId(data.tokenId);
          }
        }
      } catch (error) {
        console.warn('Background verification failed:', error);
      }
    }, 100);
  };

  const renderExistingPassport = () => (
    <div className="space-y-6 px-6 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center text-4xl">
          🛡️
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            PoEP
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">Proof-of-Existence Passport</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Your onchain identity, secured by ZK proofs</p>
        </div>
      </div>

      {/* Active Passport Status */}
      <div className="card-primary p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-2xl">
          ✅
        </div>
        <h3 className="text-xl font-bold text-primary-800 dark:text-primary-200 mb-2">
          Passport Active!
        </h3>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">{userTrustScore}</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">Trust Score</p>
          </div>
          <div className="w-px h-8 bg-primary-300 dark:bg-primary-600"></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Verified</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">Identity</p>
          </div>
        </div>
      </div>

      {/* Benefits Overview */}
      <div className="card p-6">
        <h4 className="font-semibold mb-4 text-center">How PoEP Grows</h4>
        <div className="space-y-3 text-sm">
          <p className="text-neutral-600 dark:text-neutral-300">
            Your trust score can grow with Base activity:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>• Swaps, DeFi transactions</span>
              <span className="text-neutral-400">Future updates</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• NFT mints & trades</span>
              <span className="text-neutral-400">Future updates</span>
            </div>
            <div className="flex items-center justify-between">
              <span>• Community activity</span>
              <span className="text-neutral-400">Future updates</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
            💡 Trust score updates require indexer service (coming soon)
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-xs font-medium">Soul-bound NFT secured</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-xs font-medium">Privacy preserved with ZK</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔑</div>
          <p className="text-xs font-medium">Unique per wallet</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🚫</div>
          <p className="text-xs font-medium">Non-transferable for life</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => setCurrentStep(PoEPStep.Success)}
          className="w-full btn-primary"
        >
          📊 View Full Details
        </Button>
        <Button
          onClick={refreshTrustScore}
          className="w-full btn-secondary"
        >
          🔄 Refresh Trust Score
        </Button>
        {tokenId && (
          <Button
            onClick={() => {
              const explorerUrls = getExplorerUrls(tokenId, transactionHash);
              if (explorerUrls.token) {
                window.open(explorerUrls.token, '_blank');
              }
            }}
            className="w-full btn-outline"
          >
            🔍 View on Basescan
          </Button>
        )}
      </div>
    </div>
  );

  const renderWelcome = () => (
    <div className="space-y-8 px-6 w-full max-w-md mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center text-4xl animate-pulse">
          🔐
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            PoEP
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">Proof-of-Existence Passport</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Your onchain identity, secured by ZK proofs</p>
        </div>
      </div>

      {/* Network Status */}
      {!isInFarcaster && chain && (
        <div className="card p-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Network: <span className={`font-medium ${chain.id === base.id ? 'text-green-600' : 'text-red-600'}`}>
              {chain.name}
            </span>
            {chain.id !== base.id && (
              <span className="text-red-600 ml-2">⚠️ Please switch to Base Mainnet</span>
            )}
          </p>
        </div>
      )}

      {/* Welcome content for new users */}
        <div className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-primary p-4 text-center">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200">2-second selfie</p>
            </div>
            <div className="card-accent p-4 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-medium text-accent-800 dark:text-accent-200">ZK proof locally</p>
            </div>
            <div className="card-primary p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200">Soul-bound NFT</p>
            </div>
            <div className="card-accent p-4 text-center">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm font-medium text-accent-800 dark:text-accent-200">Build trust score</p>
            </div>
          </div>

          {!walletConnected ? (
            <div className="space-y-4">
              <div className="card-primary p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-xl">
                  1️⃣
                </div>
                <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">Connect Wallet</h3>
                <p className="text-sm text-primary-600 dark:text-primary-300">
                  Connect your wallet to create your PoEP passport
                </p>
              </div>
              <WalletConnector onConnectionChange={setWalletConnected} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card-accent p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center text-xl">
                  ✅
                </div>
                <h3 className="font-semibold text-accent-800 dark:text-accent-200 mb-2">Ready to Create</h3>
                <p className="text-sm text-accent-600 dark:text-accent-300">
                  Wallet connected • Your passport awaits
                </p>
              </div>

              <Button
                onClick={startCamera}
                className="w-full btn-primary text-lg py-4"
              >
                📸 Create PoEP Passport
              </Button>

              <div className="card p-4">
                <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>Camera never leaves your device</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>Privacy guaranteed with Zero-Knowledge proofs</span>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );

  const renderCamera = () => (
    <div className="space-y-6 px-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-2xl">
          📸
        </div>
        <h3 className="text-2xl font-bold">Take Your Selfie</h3>
        <p className="text-neutral-500 dark:text-neutral-400">Position your face in the frame</p>
      </div>

      <div className="card p-6">
        <div className="relative mx-auto w-full max-w-sm aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Camera overlay guide */}
          <div className="absolute inset-4 border-2 border-dashed border-primary-400 rounded-xl pointer-events-none">
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary-500 rounded-tl"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary-500 rounded-tr"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary-500 rounded-bl"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary-500 rounded-br"></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={capturePhoto}
          className="w-full btn-success text-lg py-4"
        >
          📸 Capture Photo
        </Button>

        <button
          onClick={resetFlow}
          className="w-full text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="card p-4">
        <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Photo processed locally on your device</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Never uploaded or stored anywhere</span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderProcessing = () => (
    <div className="space-y-8 px-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
          <div className="spinner-primary w-10 h-10"></div>
        </div>
        <div>
          <h3 className="text-2xl font-bold">Creating Your Passport</h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            This may take a few moments...
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card-primary p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-xl">
              🔍
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary-800 dark:text-primary-200">Analyzing Biometric Features</h4>
              <p className="text-sm text-primary-600 dark:text-primary-300">Processing facial recognition data</p>
            </div>
            <div className="w-6 h-6 bg-primary-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="card-accent p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center text-xl">
              🧮
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-accent-800 dark:text-accent-200">Generating ZK Proof</h4>
              <p className="text-sm text-accent-600 dark:text-accent-300">Creating privacy-preserving proof</p>
            </div>
            <div className="w-6 h-6 bg-accent-500 rounded-full animate-pulse animation-delay-200"></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center text-xl">
              ⛓️
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">
                Minting Soul-bound NFT
              </h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Securing on Base blockchain
              </p>
            </div>
            <div className="w-6 h-6 bg-success-500 rounded-full animate-pulse animation-delay-500"></div>
          </div>
        </div>
      </div>

      {/* Auto-Transaction Component - More User Friendly */}
      {contractCallData && (
        <div className="card-primary p-6">
          <div className="text-center space-y-4 mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-2xl animate-pulse">
              ⚡
            </div>
            <h4 className="font-semibold text-primary-800 dark:text-primary-200">Ready to Mint Your PoEP!</h4>
            <p className="text-sm text-primary-600 dark:text-primary-300">
              Click the button below to create your unique Proof-of-Existence Passport
            </p>
          </div>

          <Transaction
            calls={[{
              to: contractCallData.to,
              data: contractCallData.data,
              value: BigInt(contractCallData.value)
            }]}
            chainId={base.id}
            onSuccess={(response) => {
              const txHash = response.transactionReceipts?.[0]?.transactionHash;
              if (txHash) {
                handleTransactionSuccess(txHash);
              } else {
                setError('Transaction completed but hash not available');
                setCurrentStep(PoEPStep.Error);
              }
            }}
            onError={(error) => {
              let errorMessage = 'Transaction failed';
              if (error.message?.includes('User rejected')) {
                errorMessage = 'Please approve the transaction in your wallet to create your PoEP passport.';
              } else if (error.message?.includes('AlreadyMinted') || error.message?.includes('Already minted')) {
                setHasExistingPassport(true);
                setUserTrustScore(100);
                setCurrentStep(PoEPStep.Success);
                return;
              } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'You need more ETH for gas fees. The cost is very low on Base (~$0.01).';
              } else {
                errorMessage = `Minting failed: ${error.message}`;
              }
              setError(errorMessage);
              setCurrentStep(PoEPStep.Error);
            }}
          >
            <TransactionButton
              className="w-full btn-primary text-lg py-4 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700"
              text="🚀 Create My PoEP Passport"
            />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>

          <div className="mt-4 text-center">
            <p className="text-xs text-primary-500 dark:text-primary-400">
              💰 Gas cost: ~$0.01 • ⚡ Fast on Base • 🔒 Soul-bound forever
            </p>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Privacy Protected</p>
          <div className="flex items-center justify-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>ZK-SNARK</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>Local Processing</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>No Data Stored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-8 px-6 w-full max-w-md mx-auto">
      {/* Success Hero */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
          🎉
        </div>
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-success-600 to-primary-600 bg-clip-text text-transparent">
            {hasExistingPassport ? 'PoEP Active!' : 'PoEP Created!'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">Your unique identity is secured on Base</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="card-primary p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{userTrustScore}</span>
            </div>
            <p className="font-semibold text-primary-800 dark:text-primary-200">Trust Score</p>
            <p className="text-xs text-primary-600 dark:text-primary-300">Building with each transaction</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <p className="font-semibold text-primary-800 dark:text-primary-200">Status</p>
            <p className="text-xs text-primary-600 dark:text-primary-300">Verified & Active</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-xs font-medium">Soul-bound NFT secured</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🛡️</div>
          <p className="text-xs font-medium">Privacy preserved with ZK</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔑</div>
          <p className="text-xs font-medium">Unique per wallet</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🚫</div>
          <p className="text-xs font-medium">Non-transferable for life</p>
        </div>
      </div>

      {/* Growth Information */}
      <div className="card-accent p-6">
        <h4 className="font-semibold text-accent-800 dark:text-accent-200 mb-4 text-center">How PoEP Grows</h4>
        <p className="text-sm text-accent-600 dark:text-accent-300 mb-4 text-center">
          Your trust score can grow with Base activity:
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">• Swaps, DeFi transactions</span>
            <span className="text-neutral-400">Future updates</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">• NFT mints & trades</span>
            <span className="text-neutral-400">Future updates</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">• Community activity</span>
            <span className="text-neutral-400">Future updates</span>
          </div>
        </div>
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-3 text-center">
          💡 Trust score updates require indexer service (coming soon)
        </p>
      </div>

      {/* Transaction Link - Primary Action for New Mints */}
      {transactionHash && !hasExistingPassport && (
        <div className="card-success p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <h4 className="font-semibold text-success-800 dark:text-success-200 mb-2">NFT Successfully Minted!</h4>
          <p className="text-sm text-success-600 dark:text-success-300 mb-4">
            Your PoEP passport is now live on Base blockchain
          </p>
          <Button
            onClick={() => {
              const explorerUrls = getExplorerUrls(tokenId, transactionHash);
              const url = explorerUrls.transaction || explorerUrls.token;
              if (url) {
                window.open(url, '_blank');
              }
            }}
            className="w-full btn-primary text-lg py-4 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700"
          >
            🔍 View on BaseScan
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-4">
        <div className="space-y-3">
          {/* Show Back to Home as primary when it's an existing passport */}
          {hasExistingPassport && (
            <Button
              onClick={resetFlow}
              className="w-full btn-primary"
            >
              ← Back to Home
            </Button>
          )}

          {/* Show Back to Home as secondary when it's a new mint with transaction */}
          {!hasExistingPassport && (
            <Button
              onClick={resetFlow}
              className="w-full btn-secondary"
            >
              ← Back to Home
            </Button>
          )}

          <Button
            onClick={refreshTrustScore}
            className="w-full btn-secondary"
          >
            🔄 Refresh Trust Score
          </Button>

          {/* Legacy explorer link for existing passports */}
          {(tokenId || transactionHash) && hasExistingPassport && (
            <Button
              onClick={() => {
                const explorerUrls = getExplorerUrls(tokenId, transactionHash);
                const url = explorerUrls.token || explorerUrls.transaction;
                if (url) {
                  window.open(url, '_blank');
                }
              }}
              className="w-full btn-outline"
            >
              🔍 View on Basescan
            </Button>
          )}
        </div>

        <div className="card p-4 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            🔒 Only one PoEP per wallet allowed • Your unique identity is now secured
          </p>
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-4">
      <div className="text-4xl">❌</div>
      <h3 className="text-lg font-semibold text-red-600">Something went wrong</h3>

      <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-left">
        <div className="text-sm text-red-800 whitespace-pre-wrap">
          {error}
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={resetFlow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          🔄 Try Again
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>If the problem persists:</p>
          <p>• Refresh the page</p>
          <p>• Check your internet connection</p>
          <p>• Ensure your wallet has sufficient ETH</p>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PoEP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-6">
      <div className="w-full max-w-md mx-auto">
        {currentStep === PoEPStep.Welcome && (
          hasExistingPassport ? renderExistingPassport() : renderWelcome()
        )}
        {currentStep === PoEPStep.Camera && renderCamera()}
        {currentStep === PoEPStep.Processing && renderProcessing()}
        {currentStep === PoEPStep.Success && renderSuccess()}
        {currentStep === PoEPStep.Error && renderError()}
      </div>
    </div>
  );
} 