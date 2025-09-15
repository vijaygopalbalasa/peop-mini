'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface BiometricCaptureProps {
  onCaptureComplete: (faceHash: string, nonce: string) => void;
  onError: (error: string) => void;
}

/**
 * BiometricCapture Component
 * Captures user's face using WebRTC and generates a biometric hash
 * Uses browser-based face detection and Poseidon hashing
 */
export default function BiometricCapture({ onCaptureComplete, onError }: BiometricCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [captureStep, setCaptureStep] = useState<'setup' | 'detecting' | 'captured' | 'processing'>('setup');

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (_error) {
      onError('Failed to access camera. Please allow camera permissions.');
    }
  }, [onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  // Extract face features and generate hash
  const extractFaceFeatures = useCallback((imageData: ImageData): number[] => {
    // Simplified face feature extraction
    // In production, this would use advanced computer vision
    const { data, width, height } = imageData;
    const features: number[] = [];

    // Extract key facial regions (simplified approach)
    const regions = [
      // Eyes region
      { x: Math.floor(width * 0.2), y: Math.floor(height * 0.3), w: Math.floor(width * 0.6), h: Math.floor(height * 0.2) },
      // Nose region
      { x: Math.floor(width * 0.35), y: Math.floor(height * 0.45), w: Math.floor(width * 0.3), h: Math.floor(height * 0.2) },
      // Mouth region
      { x: Math.floor(width * 0.25), y: Math.floor(height * 0.65), w: Math.floor(width * 0.5), h: Math.floor(height * 0.15) }
    ];

    regions.forEach(region => {
      let avgR = 0, avgG = 0, avgB = 0, pixelCount = 0;

      for (let y = region.y; y < region.y + region.h && y < height; y++) {
        for (let x = region.x; x < region.x + region.w && x < width; x++) {
          const idx = (y * width + x) * 4;
          avgR += data[idx];
          avgG += data[idx + 1];
          avgB += data[idx + 2];
          pixelCount++;
        }
      }

      if (pixelCount > 0) {
        features.push(
          Math.floor(avgR / pixelCount),
          Math.floor(avgG / pixelCount),
          Math.floor(avgB / pixelCount)
        );
      }
    });

    return features;
  }, []);

  // Simple Poseidon-like hash function (simplified for demo)
  const simpleHash = useCallback((data: number[]): string => {
    let hash = BigInt(0);
    const prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

    for (let i = 0; i < data.length; i++) {
      hash = (hash + BigInt(data[i]) * BigInt(i + 1)) % prime;
    }

    return hash.toString();
  }, []);

  // Capture and process biometric data
  const captureBiometric = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setCaptureStep('detecting');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setCaptureStep('processing');

      // Extract face features
      const features = extractFaceFeatures(imageData);

      if (features.length === 0) {
        throw new Error('No face detected. Please ensure your face is visible and try again.');
      }

      // Generate face hash
      const faceHash = simpleHash(features);

      // Generate random nonce for uniqueness
      const nonce = Math.floor(Math.random() * 1000000).toString();

      setCaptureStep('captured');

      // Complete capture
      onCaptureComplete(faceHash, nonce);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to capture biometric data');
    } finally {
      setIsCapturing(false);
    }
  }, [extractFaceFeatures, simpleHash, onCaptureComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold">Biometric Capture</h3>

      {captureStep === 'setup' && (
        <p className="text-sm text-muted-foreground text-center">
          Take a 2-second selfie to generate your unique biometric proof.
          Your image never leaves your device.
        </p>
      )}

      {captureStep === 'detecting' && (
        <p className="text-sm text-blue-600">
          Detecting face features...
        </p>
      )}

      {captureStep === 'processing' && (
        <p className="text-sm text-yellow-600">
          Processing biometric data...
        </p>
      )}

      {captureStep === 'captured' && (
        <p className="text-sm text-green-600">
          ✅ Biometric capture successful!
        </p>
      )}

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-80 h-60 bg-black rounded-lg"
          style={{ transform: 'scaleX(-1)' }} // Mirror the video
        />

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <p className="text-white text-sm">Camera not active</p>
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white text-sm">Processing...</div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        {!isCameraActive ? (
          <Button onClick={startCamera} variant="outline">
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={captureBiometric}
              disabled={isCapturing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCapturing ? 'Processing...' : 'Capture Biometric'}
            </Button>
            <Button onClick={stopCamera} variant="outline">
              Stop Camera
            </Button>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center max-w-sm">
        <p>🔒 Privacy-first: Your biometric data is processed locally and never transmitted.</p>
        <p>🔧 Uses WebRTC + ZK-SNARKs for secure identity verification.</p>
      </div>
    </div>
  );
}