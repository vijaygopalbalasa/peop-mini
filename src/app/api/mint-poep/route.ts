import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { rateLimit } from '~/lib/rateLimit';

const POEP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per minute
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const remaining = await limiter.check(identifier);

    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { proof, nullifier, userAddress } = body;

    console.log('Received minting request:', {
      hasProof: !!proof,
      hasNullifier: !!nullifier,
      hasUserAddress: !!userAddress,
      proofStructure: proof ? Object.keys(proof) : 'no proof'
    });

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

    // Use the correct contract ABI from constants
    const { POEP_CONTRACT_ABI } = await import('~/lib/constants');
    const contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, POEP_CONTRACT_ABI, wallet);

    // Normalize the user address
    const normalizedAddress = ethers.getAddress(userAddress);

    // Check if user already has a PoEP using balanceOf
    const balance = await contract.balanceOf(normalizedAddress);
    const hasExisting = balance > 0;

    if (hasExisting) {
      return NextResponse.json(
        { error: 'PoEP already exists for this user' },
        { status: 409 }
      );
    }

    // Validate and format proof for contract - expecting pA, pB, pC format from contract.ts
    if (!proof.pA || !proof.pB || !proof.pC || !proof.nullifier) {
      return NextResponse.json(
        { error: 'Invalid proof structure: missing pA, pB, pC, or nullifier' },
        { status: 400 }
      );
    }

    // Format proof according to contract ABI: mint(uint256[2] _pA, uint256[2][2] _pB, uint256[2] _pC, uint256 _nullifier)
    const pA = proof.pA; // [2] array
    const pB = proof.pB; // [2][2] array
    const pC = proof.pC; // [2] array
    const nullifierBigInt = BigInt(proof.nullifier);

    console.log('Minting with proof:', { pA, pB, pC, nullifier: nullifierBigInt.toString() });

    // Submit transaction to mint PoEP with proper gas estimation
    const gasEstimate = await contract.mint.estimateGas(pA, pB, pC, nullifierBigInt);
    const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

    const tx = await contract.mint(pA, pB, pC, nullifierBigInt, {
      gasLimit: gasLimit
    });
    const receipt = await tx.wait();

    // Verify the transaction was successful
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed on-chain');
    }

    // Get the newly minted token ID and trust score
    const trustScore = await contract.viewTrustScore(normalizedAddress);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      trustScore: trustScore.toString(),
      tokenId: receipt.logs[0]?.topics[3] // Assuming Transfer event
    });

  } catch (error: any) {
    console.error('Minting error:', error);

    // Provide specific error messages for common failures
    let errorMessage = 'Minting failed';
    let errorDetails = '';

    if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH for gas fees';
      errorDetails = 'Please add more ETH to your wallet to cover gas costs';
    } else if (error.message?.includes('execution reverted')) {
      errorMessage = 'Smart contract execution failed';
      errorDetails = error.reason || 'Transaction was reverted by the contract';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network connection error';
      errorDetails = 'Please check your internet connection and try again';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Transaction timeout';
      errorDetails = 'The transaction took too long to process. Please try again';
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      errorMessage = 'Gas estimation failed';
      errorDetails = 'Unable to estimate gas. The transaction may fail or contract may not be deployed';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails || (isDevelopment ? error.message : 'Please try again or contact support'),
        ...(isDevelopment && {
          fullError: error.message,
          code: error.code,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        })
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
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