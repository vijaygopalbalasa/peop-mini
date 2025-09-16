import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { rateLimit } from '~/lib/rateLimit';

const POEP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_RPC_URL = process.env.NODE_ENV === 'production'
  ? (process.env.BASE_RPC_URL || 'https://mainnet.base.org')
  : (process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per minute
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== MINT POEP API STARTED ===');

    // Environment validation
    if (!POEP_CONTRACT_ADDRESS || !PRIVATE_KEY) {
      console.error('Missing environment variables:', {
        hasContractAddress: !!POEP_CONTRACT_ADDRESS,
        hasPrivateKey: !!PRIVATE_KEY,
        hasRpcUrl: !!BASE_RPC_URL
      });
      return NextResponse.json(
        { error: 'Server configuration error: Missing required environment variables' },
        { status: 500 }
      );
    }

    // Apply rate limiting
    const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';

    try {
      const remaining = await limiter.check(identifier);
      if (remaining <= 0) {
        console.log('Rate limit exceeded for identifier:', identifier);
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    } catch (rateLimitError) {
      console.warn('Rate limiting error (proceeding anyway):', rateLimitError);
    }

    const body = await request.json();
    const { proof, nullifier, userAddress } = body;

    console.log('Received minting request:', {
      hasProof: !!proof,
      hasNullifier: !!nullifier,
      hasUserAddress: !!userAddress,
      proofStructure: proof ? Object.keys(proof) : 'no proof',
      nullifierType: typeof nullifier,
      userAddressType: typeof userAddress
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

    // Validate proof structure - expect pA, pB, pC format from contract.ts
    if (!proof.pA || !proof.pB || !proof.pC) {
      return NextResponse.json(
        { error: 'Invalid proof structure: missing pA, pB, or pC' },
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
    console.log('Connecting to Base network...');
    let provider, wallet, contract, normalizedAddress;

    try {
      provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      console.log('RPC provider created');

      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      console.log('Wallet created, address:', wallet.address);

      // Test network connection
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name, 'chainId:', network.chainId);

      // Use the correct contract ABI from constants
      const { POEP_CONTRACT_ABI } = await import('~/lib/constants');
      console.log('Contract ABI loaded');

      contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, POEP_CONTRACT_ABI, wallet);
      console.log('Contract instance created');

      // Normalize the user address
      normalizedAddress = ethers.getAddress(userAddress);
      console.log('Normalized address:', normalizedAddress);

      // Check if user already has a PoEP using balanceOf
      console.log('Checking existing balance...');
      const balance = await contract.balanceOf(normalizedAddress);
      console.log('User balance:', balance.toString());

      const hasExisting = balance > 0;

      if (hasExisting) {
        console.log('User already has PoEP, rejecting');
        return NextResponse.json(
          { error: 'PoEP already exists for this user' },
          { status: 409 }
        );
      }

      console.log('Balance check passed, proceeding with mint');
    } catch (networkError) {
      console.error('Network/Contract setup error:', networkError);
      return NextResponse.json(
        {
          error: 'Blockchain connection failed',
          details: `Network error: ${networkError.message}`,
          code: networkError.code
        },
        { status: 500 }
      );
    }

    // Proof is already validated above - format for contract call

    // Format proof according to contract ABI: mint(uint256[2] _pA, uint256[2][2] _pB, uint256[2] _pC, uint256 _nullifier)
    const pA = proof.pA; // [2] array
    const pB = proof.pB; // [2][2] array
    const pC = proof.pC; // [2] array
    const nullifierBigInt = BigInt(nullifier); // Use the separate nullifier parameter

    console.log('Minting with proof:', { pA, pB, pC, nullifier: nullifierBigInt.toString() });

    // Submit transaction to mint PoEP with proper gas estimation
    try {
      console.log('Estimating gas for mint transaction...');
      const gasEstimate = await contract.mint.estimateGas(pA, pB, pC, nullifierBigInt);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer
      console.log('Gas estimate:', gasEstimate.toString(), 'Gas limit:', gasLimit.toString());

      console.log('Submitting mint transaction...');
      const tx = await contract.mint(pA, pB, pC, nullifierBigInt, {
        gasLimit: gasLimit
      });
      console.log('Transaction submitted:', tx.hash);

      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash, 'Status:', receipt.status);

      // Verify the transaction was successful
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on-chain');
      }

      // Get the newly minted token ID and trust score
      console.log('Fetching trust score...');
      const trustScore = await contract.viewTrustScore(normalizedAddress);
      console.log('Trust score:', trustScore.toString());

      const result = {
        success: true,
        transactionHash: receipt.hash,
        trustScore: trustScore.toString(),
        tokenId: receipt.logs[0]?.topics[3] // Assuming Transfer event
      };

      console.log('Mint successful:', result);
      return NextResponse.json(result);
    } catch (mintError) {
      console.error('Minting transaction error:', mintError);

      // Provide specific error handling
      if (mintError.message?.includes('execution reverted')) {
        const revertReason = mintError.reason || mintError.data || 'Unknown revert reason';
        console.error('Contract revert reason:', revertReason);

        return NextResponse.json(
          {
            error: 'Smart contract rejected the transaction',
            details: revertReason,
            code: 'CONTRACT_REVERT'
          },
          { status: 400 }
        );
      }

      if (mintError.code === 'UNPREDICTABLE_GAS_LIMIT') {
        console.error('Gas estimation failed - contract may not be deployed or proof invalid');
        return NextResponse.json(
          {
            error: 'Transaction simulation failed',
            details: 'The transaction would fail. Check if the contract is deployed and the proof is valid.',
            code: 'GAS_ESTIMATION_FAILED'
          },
          { status: 400 }
        );
      }

      // Re-throw for general error handler
      throw mintError;
    }

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