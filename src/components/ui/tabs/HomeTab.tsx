"use client";

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Button } from '../Button';
import { WalletConnector } from '../../WalletConnector';
import { generateFaceHash, generateZKProof, type ZKProofResult } from '~/lib/zkProof';
import { generateZKProof as contractGenerateZKProof } from '~/lib/contract';

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
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Base MiniKit integration
  const { context } = useMiniKit();
  const user = context?.user;
  // Wallet integration
  const { address, isConnected } = useAccount();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update wallet connection state
  useEffect(() => {
    setWalletConnected(isConnected);
  }, [isConnected]);

  // Check for existing passport when component mounts
  useEffect(() => {
    const checkExistingPassport = async () => {
      if (user?.fid) {
        try {
          const response = await fetch(`/api/check-poep?fid=${user.fid}`);
          if (response.ok) {
            const data = await response.json();
            setHasExistingPassport(data.hasPoEP);
            setUserTrustScore(data.trustScore || 0);
          }
        } catch (error) {
          setHasExistingPassport(false);
          setUserTrustScore(0);
        }
      }
    };

    checkExistingPassport();
  }, [user]);

  const startCamera = async () => {
    try {
      setError(null);
      setCurrentStep(PoEPStep.Camera);

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
    } catch (err) {
      console.warn('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
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
        if (!address) {
          throw new Error('Wallet address is required for ZK proof generation');
        }
        proof = await generateZKProof(faceHash, address);
        setZkProof(proof);
      } catch (err) {
        throw new Error(`ZK proof generation failed: ${(err as Error).message}`);
      }

      // Step 3: Mint soul-bound NFT
      try {
        await mintPoEPNFT(proof);
      } catch (err) {
        throw new Error(`NFT minting failed: ${(err as Error).message}`);
      }

      setCurrentStep(PoEPStep.Success);
    } catch (err: any) {
      console.error('PoEP creation failed:', err);

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


  const mintPoEPNFT = async (proof: ZKProofResult) => {
    try {
      // Generate contract-compatible ZK proof using the same face hash
      if (!address) {
        throw new Error('Wallet address is required for contract proof generation');
      }
      const contractProof = await contractGenerateZKProof(proof.faceHash, proof.nonce, address);

      // Validate wallet connection before minting
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Submit the ZK proof to the PoEP smart contract on Base
      const response = await fetch('/api/mint-poep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: contractProof,
          nullifier: proof.nullifier.toString(), // Convert BigInt to string
          userAddress: address // Use the connected wallet address
        })
      });

      if (!response.ok) {
        throw new Error('Minting failed');
      }

      const result = await response.json();

      // Update user state after successful mint
      setUserTrustScore(result.trustScore || 100);
      setHasExistingPassport(true);
    } catch (error) {
      throw error;
    }
  };

  const resetFlow = () => {
    setCurrentStep(PoEPStep.Welcome);
    setCapturedImage(null);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🔐 PoEP</h1>
        <h2 className="text-xl font-semibold text-blue-600">Proof-of-Existence Passport</h2>
      </div>

      {hasExistingPassport ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800 font-semibold">✅ Passport Active</p>
            <p className="text-sm text-green-600">
              Trust Score: {userTrustScore} • Verified Human
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>Your PoEP is working on Base:</p>
            <p>📈 Trust score increases with each transaction</p>
            <p>🎯 Unlocks perks across dApps</p>
            <p>🔒 Privacy preserved with ZK proofs</p>
          </div>

          <Button
            onClick={() => setCurrentStep(PoEPStep.Success)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            View Details
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4 text-sm text-gray-600">
            <p>Your privacy-first identity badge for Base</p>
            <div className="space-y-2">
              <p>✨ Take a 2-second selfie</p>
              <p>🔒 Generate ZK proof locally</p>
              <p>🎯 Mint soul-bound NFT</p>
              <p>📈 Build trust score</p>
            </div>
          </div>

          {!walletConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-semibold">Step 1: Connect Wallet</p>
                <p className="text-sm text-blue-600">
                  Connect your wallet to create your PoEP
                </p>
              </div>
              <WalletConnector onConnectionChange={setWalletConnected} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-semibold">Step 2: Create PoEP</p>
                <p className="text-sm text-green-600">
                  Wallet connected • Ready to create your passport
                </p>
              </div>

              <Button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
              >
                📸 Create PoEP
              </Button>

              <p className="text-xs text-gray-500">
                Camera never leaves your device • Privacy guaranteed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCamera = () => (
    <div className="text-center space-y-4">
      <h3 className="text-lg font-semibold">Take Your Selfie</h3>

      <div className="relative mx-auto w-64 h-48 bg-gray-100 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-2">
        <Button
          onClick={capturePhoto}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          📸 Capture
        </Button>
        <br />
        <button
          onClick={resetFlow}
          className="text-sm text-gray-500 underline"
        >
          Cancel
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-4">
      <h3 className="text-lg font-semibold">Processing...</h3>
      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      <div className="space-y-2 text-sm text-gray-600">
        <p>🔍 Analyzing biometric features</p>
        <p>🧮 Generating ZK proof</p>
        <p>⛓️ Minting soul-bound NFT</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-green-600">
          {hasExistingPassport ? 'PoEP Active!' : 'PoEP Created!'}
        </h3>
        <p className="text-sm text-gray-600">Your unique identity is secured on Base</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-gray-800">Trust Score</p>
            <p className="text-2xl font-bold text-green-600">{userTrustScore}</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-gray-800">Status</p>
            <p className="text-sm text-green-600">✅ Verified</p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p>✅ Soul-bound NFT secured</p>
          <p>✅ Privacy preserved with ZK</p>
          <p>✅ Unique per wallet</p>
          <p>✅ Non-transferable for life</p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
        <p className="font-semibold text-blue-800">How PoEP Grows:</p>
        <p className="text-blue-600">Your trust score increases automatically with every Base transaction:</p>
        <div className="space-y-1 text-xs text-blue-500">
          <p>• Swaps, casts, stakes → +1 point each</p>
          <p>• NFT mints → +2 points</p>
          <p>• Complex DeFi → +3 points</p>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={resetFlow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          ← Back to Home
        </Button>

        {!hasExistingPassport && (
          <p className="text-xs text-gray-500">
            Only one PoEP per wallet allowed
          </p>
        )}
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
        {currentStep === PoEPStep.Welcome && renderWelcome()}
        {currentStep === PoEPStep.Camera && renderCamera()}
        {currentStep === PoEPStep.Processing && renderProcessing()}
        {currentStep === PoEPStep.Success && renderSuccess()}
        {currentStep === PoEPStep.Error && renderError()}
      </div>
    </div>
  );
} 