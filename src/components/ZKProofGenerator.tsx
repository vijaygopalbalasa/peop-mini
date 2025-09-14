'use client';

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';

interface ZKProofGeneratorProps {
  faceHash: string;
  nonce: string;
  onProofGenerated: (proof: any, nullifier: string) => void;
  onError: (error: string) => void;
}

/**
 * ZKProofGenerator Component
 * Generates ZK-SNARK proofs using the Circom circuit and SnarkJS
 * Proves knowledge of face hash without revealing it
 */
export default function ZKProofGenerator({
  faceHash,
  nonce,
  onProofGenerated,
  onError
}: ZKProofGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'ready' | 'loading-circuit' | 'computing-witness' | 'generating-proof' | 'complete'>('ready');

  // Load circuit files and generate proof
  const generateProof = useCallback(async () => {
    setIsGenerating(true);
    setGenerationStep('loading-circuit');

    try {
      // Import snarkjs dynamically to ensure it loads in browser
      const snarkjs = await import('snarkjs');

      setGenerationStep('loading-circuit');

      // Load circuit files
      const [wasmResponse, zkeyResponse] = await Promise.all([
        fetch('/circuit.wasm'),
        fetch('/circuit_final.zkey')
      ]);

      if (!wasmResponse.ok || !zkeyResponse.ok) {
        throw new Error('Failed to load circuit files');
      }

      const wasmBuffer = await wasmResponse.arrayBuffer();
      const zkeyBuffer = await zkeyResponse.arrayBuffer();

      setGenerationStep('computing-witness');

      // Convert inputs to field elements
      const faceHashBigInt = BigInt(faceHash);
      const nonceBigInt = BigInt(nonce);

      // Prepare circuit inputs
      const inputs = {
        faceHash: faceHashBigInt.toString(),
        nonce: nonceBigInt.toString()
      };

      console.log('Circuit inputs:', inputs);

      setGenerationStep('generating-proof');

      // Generate the proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        new Uint8Array(wasmBuffer),
        new Uint8Array(zkeyBuffer)
      );

      console.log('Generated proof:', proof);
      console.log('Public signals (nullifier):', publicSignals);

      // The first (and only) public signal is our nullifier
      const nullifier = publicSignals[0];

      setGenerationStep('complete');

      // Format proof for Solidity
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]]
      };

      onProofGenerated(solidityProof, nullifier);

    } catch (error) {
      console.error('Proof generation error:', error);

      if (error instanceof Error) {
        onError(`Proof generation failed: ${error.message}`);
      } else {
        onError('Failed to generate ZK proof. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [faceHash, nonce, onProofGenerated, onError]);

  // Generate mock proof for demo purposes (when circuit files aren't available)
  const generateMockProof = useCallback(async () => {
    setIsGenerating(true);
    setGenerationStep('loading-circuit');

    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('computing-witness');
      await new Promise(resolve => setTimeout(resolve, 800));

      setGenerationStep('generating-proof');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Generate mock proof with realistic-looking values
      const mockProof = {
        a: [
          "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0'),
          "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0')
        ],
        b: [
          [
            "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0'),
            "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0')
          ],
          [
            "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0'),
            "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0')
          ]
        ],
        c: [
          "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0'),
          "0x" + BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(16).padStart(64, '0')
        ]
      };

      // Generate deterministic nullifier from inputs (simplified Poseidon)
      const faceHashBigInt = BigInt(faceHash);
      const nonceBigInt = BigInt(nonce);
      const nullifier = ((faceHashBigInt + nonceBigInt) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')).toString();

      setGenerationStep('complete');

      onProofGenerated(mockProof, nullifier);

    } catch (_error) {
      onError('Failed to generate proof. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [faceHash, nonce, onProofGenerated, onError]);

  const getStepDescription = () => {
    switch (generationStep) {
      case 'loading-circuit':
        return 'Loading ZK circuit files...';
      case 'computing-witness':
        return 'Computing circuit witness...';
      case 'generating-proof':
        return 'Generating ZK-SNARK proof...';
      case 'complete':
        return '✅ Proof generated successfully!';
      default:
        return 'Ready to generate proof';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold">ZK Proof Generation</h3>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Generate a zero-knowledge proof of your biometric data
        </p>

        {faceHash && (
          <div className="text-xs font-mono bg-muted p-2 rounded max-w-sm overflow-hidden">
            Face Hash: {faceHash.slice(0, 20)}...
          </div>
        )}

        {generationStep !== 'ready' && (
          <p className="text-sm text-blue-600">
            {getStepDescription()}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm">
        {isGenerating && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width:
                  generationStep === 'loading-circuit' ? '25%' :
                  generationStep === 'computing-witness' ? '50%' :
                  generationStep === 'generating-proof' ? '75%' :
                  generationStep === 'complete' ? '100%' : '0%'
              }}
            />
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={generateProof}
          disabled={isGenerating || !faceHash}
          className="bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? 'Generating...' : 'Generate Real Proof'}
        </Button>

        <Button
          onClick={generateMockProof}
          disabled={isGenerating || !faceHash}
          variant="outline"
        >
          Generate Demo Proof
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center max-w-sm">
        <p>🔒 Zero-knowledge: Proves you own the biometric without revealing it</p>
        <p>⚡ Uses Groth16 for efficient on-chain verification</p>
        <p>🛡️ Prevents double-minting with unique nullifiers</p>
      </div>
    </div>
  );
}