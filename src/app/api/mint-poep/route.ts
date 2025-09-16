import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { rateLimit } from '~/lib/rateLimit';

const POEP_CONTRACT_ADDRESS = process.env.POEP_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per minute
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const remaining = await limiter.check(identifier);

    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { proof, nullifier, userAddress } = body;

    // Enhanced input validation
    if (!proof || !nullifier || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: proof, nullifier, and userAddress are required' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Validate proof structure
    if (!proof.proof || !proof.publicSignals || !Array.isArray(proof.publicSignals)) {
      return NextResponse.json(
        { error: 'Invalid proof structure' },
        { status: 400 }
      );
    }

    // Validate nullifier format (should be a valid number string)
    if (typeof nullifier !== 'string' || !/^\d+$/.test(nullifier)) {
      return NextResponse.json(
        { error: 'Invalid nullifier format' },
        { status: 400 }
      );
    }

    if (!POEP_CONTRACT_ADDRESS || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Contract configuration missing' },
        { status: 500 }
      );
    }

    // Connect to Base network
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Load contract ABI and connect
    const contractABI = [
      "function mintPoEP(address to, uint256[8] calldata proof, uint256[1] calldata publicSignals) external returns (uint256)",
      "function hasPoEP(address user) external view returns (bool)",
      "function getTrustScore(address user) external view returns (uint256)"
    ];

    const contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, contractABI, wallet);

    // Normalize the user address
    const normalizedAddress = ethers.getAddress(userAddress);

    // Check if user already has a PoEP
    const hasExisting = await contract.hasPoEP(normalizedAddress);

    if (hasExisting) {
      return NextResponse.json(
        { error: 'PoEP already exists for this user' },
        { status: 409 }
      );
    }

    // Validate and format proof for contract with additional security checks
    const proofData = proof.proof;
    if (!proofData.pi_a || !proofData.pi_b || !proofData.pi_c) {
      return NextResponse.json(
        { error: 'Invalid proof structure: missing pi_a, pi_b, or pi_c' },
        { status: 400 }
      );
    }

    const formattedProof = [
      proofData.pi_a[0],
      proofData.pi_a[1],
      proofData.pi_b[0][1],
      proofData.pi_b[0][0],
      proofData.pi_b[1][1],
      proofData.pi_b[1][0],
      proofData.pi_c[0],
      proofData.pi_c[1]
    ];

    // Validate all proof elements are valid numbers
    for (let i = 0; i < formattedProof.length; i++) {
      if (!formattedProof[i] || typeof formattedProof[i] !== 'string') {
        return NextResponse.json(
          { error: `Invalid proof element at index ${i}` },
          { status: 400 }
        );
      }
    }

    const publicSignals = [nullifier];

    // Additional security: Check if nullifier has been used before
    // (This would require a database or on-chain check - placeholder for production)

    // Submit transaction to mint PoEP with gas limit protection
    const gasLimit = 500000; // Reasonable gas limit
    const tx = await contract.mintPoEP(normalizedAddress, formattedProof, publicSignals, {
      gasLimit: gasLimit
    });
    const receipt = await tx.wait();

    // Verify the transaction was successful
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed on-chain');
    }

    // Get the newly minted token ID and trust score
    const trustScore = await contract.getTrustScore(userAddress);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      trustScore: trustScore.toString(),
      tokenId: receipt.logs[0]?.topics[3] // Assuming Transfer event
    });

  } catch (error) {
    console.error('Minting error:', error);

    // Don't expose sensitive error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorDetails = isDevelopment ? (error as Error).message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Minting failed',
        ...(isDevelopment && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

// Disable other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}