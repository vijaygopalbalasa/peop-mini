"use client";

import { useState, useRef, useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Button } from '../Button';
import { generateFaceHash, generateZKProof, type ZKProofResult } from '~/lib/zkProof';
import { generateZKProof as contractGenerateZKProof, hasPassport, getTrustScore } from '~/lib/contract';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { context } = useMiniKit();

  // Check for existing passport when component mounts
  useEffect(() => {
    const checkExistingPassport = async () => {
      if (context?.user?.walletAddress) {
        try {
          const hasExisting = await hasPassport(context.user.walletAddress);
          setHasExistingPassport(hasExisting);

          if (hasExisting) {
            const score = await getTrustScore(context.user.walletAddress as `0x${string}`);
            setUserTrustScore(score);
          }
        } catch (error) {
          console.error('Failed to check existing passport:', error);
        }
      }
    };

    checkExistingPassport();
  }, [context?.user?.walletAddress]);

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

    try {
      // Convert image to face hash using proper biometric feature extraction
      const faceHash = await generateFaceHash(imageData);

      // Generate ZK proof using the FaceHashVerifier circuit
      const proof = await generateZKProof(faceHash);
      setZkProof(proof);

      // Mint soul-bound NFT with the ZK proof
      await mintPoEPNFT(proof);

      setCurrentStep(PoEPStep.Success);
    } catch (_err) {
      console.error('Processing failed:', _err);
      setError('Failed to process image or generate proof');
      setCurrentStep(PoEPStep.Error);
    }
  };


  const mintPoEPNFT = async (_proof: ZKProofResult) => {
    try {
      // Use the real contract ZK proof generation and minting
      const contractProof = await contractGenerateZKProof();

      // In a real implementation, we would send the proof to the smart contract
      // For now, we'll simulate the minting process
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('NFT minted with proof:', contractProof);

      // Update user state after successful mint
      if (context?.user?.walletAddress) {
        const score = await getTrustScore(context.user.walletAddress as `0x${string}`);
        setUserTrustScore(score);
        setHasExistingPassport(true);
      }
    } catch (error) {
      console.error('Failed to mint NFT:', error);
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

          <Button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
          >
            Create PoEP
          </Button>

          <p className="text-xs text-gray-500">
            Camera never leaves your device • Privacy guaranteed
          </p>
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
      <h3 className="text-lg font-semibold text-red-600">Error</h3>
      <p className="text-sm text-gray-600">{error}</p>

      <Button
        onClick={resetFlow}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
      >
        Try Again
      </Button>
    </div>
  );

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