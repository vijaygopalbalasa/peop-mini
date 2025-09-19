import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { defaultRateLimit } from '~/lib/secureRateLimit';

const POEP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';

// Production logging utility
function secureLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console[level](`[MINT-POEP] ${message}`, data || '');
  }
  // In production, this would send to a secure logging service
}

export async function POST(request: NextRequest) {
  try {
    secureLog('info', 'MINT POEP API request started');

    // Environment validation
    if (!POEP_CONTRACT_ADDRESS || !PRIVATE_KEY) {
      secureLog('error', 'Missing critical environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Enhanced rate limiting with security features
    const identifier = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      request.headers.get('cf-connecting-ip') ||
                      'anonymous';

    const userAgent = request.headers.get('user-agent') || '';
    const requestContext = {
      userAgent,
      ip: identifier,
      headers: {
        'content-type': request.headers.get('content-type') || '',
        'origin': request.headers.get('origin') || '',
        'referer': request.headers.get('referer') || ''
      }
    };

    const rateLimitResult = await defaultRateLimit.check(
      identifier,
      3, // 3 requests per minute for minting
      requestContext
    );

    if (rateLimitResult.blocked || rateLimitResult.remaining < 0) {
      secureLog('warn', 'Rate limit exceeded', {
        identifier: identifier.substring(0, 8) + '...',
        reason: rateLimitResult.reason
      });
      return NextResponse.json(
        {
          error: rateLimitResult.reason || 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    // Enhanced input validation and sanitization
    let body;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { proof, nullifier, userAddress } = body;

    secureLog('info', 'Processing mint request', {
      hasProof: !!proof,
      hasNullifier: !!nullifier,
      hasValidAddress: !!userAddress && ethers.isAddress(userAddress)
    });

    // Comprehensive input validation with security checks
    const validationErrors = [];

    if (!proof || typeof proof !== 'object') {
      validationErrors.push('Invalid proof');
    }

    if (!nullifier || typeof nullifier !== 'string' || !/^\d+$/.test(nullifier)) {
      validationErrors.push('Invalid nullifier format');
    }

    if (!userAddress || typeof userAddress !== 'string') {
      validationErrors.push('Invalid user address');
    }

    // Additional security: check for potential injection attempts
    if (userAddress && (userAddress.includes('<') || userAddress.includes('>') || userAddress.includes('script'))) {
      validationErrors.push('Invalid address format');
    }

    if (validationErrors.length > 0) {
      secureLog('warn', 'Input validation failed', { errors: validationErrors.length });
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Validate proof structure
    if (!proof.pA || !proof.pB || !proof.pC ||
        !Array.isArray(proof.pA) || !Array.isArray(proof.pB) || !Array.isArray(proof.pC)) {
      return NextResponse.json(
        { error: 'Invalid proof structure' },
        { status: 400 }
      );
    }

    // Validate nullifier value constraints
    try {
      const nullifierBigInt = BigInt(nullifier);
      if (nullifierBigInt <= 0n) {
        throw new Error('Nullifier must be positive');
      }
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid nullifier value' },
        { status: 400 }
      );
    }

    if (!POEP_CONTRACT_ADDRESS || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Contract configuration missing' },
        { status: 500 }
      );
    }

    // Secure blockchain connection setup
    secureLog('info', 'Initializing blockchain connection');
    let provider, wallet, contract, normalizedAddress;

    try {
      provider = new ethers.JsonRpcProvider(BASE_RPC_URL, undefined, {
        staticNetwork: true // Performance optimization
      });

      wallet = new ethers.Wallet(PRIVATE_KEY, provider);

      // Test network connection with timeout
      const networkPromise = provider.getNetwork();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network connection timeout')), 10000)
      );

      const network = await Promise.race([networkPromise, timeoutPromise]);
      secureLog('info', 'Connected to blockchain network', { chainId: network.chainId.toString() });

      // Load contract ABI securely
      const { POEP_CONTRACT_ABI } = await import('~/lib/constants');
      secureLog('info', 'Using contract address', { address: POEP_CONTRACT_ADDRESS });
      contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, POEP_CONTRACT_ABI, wallet);

      // Normalize and validate the user address
      try {
        normalizedAddress = ethers.getAddress(userAddress);
      } catch (_error) {
        throw new Error('Invalid address format');
      }

      // Check existing balance with timeout protection
      secureLog('info', 'Checking user balance');

      const balancePromise = contract.balanceOf(normalizedAddress);
      const balanceTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Balance check timeout')), 15000)
      );

      const balance = await Promise.race([balancePromise, balanceTimeoutPromise]);
      const hasExisting = balance > 0n;

      if (hasExisting) {
        secureLog('info', 'User already has PoEP token');
        return NextResponse.json(
          { error: 'PoEP already exists for this user' },
          { status: 409 }
        );
      }

      secureLog('info', 'Balance check passed, proceeding with mint');
    } catch (networkError: any) {
      secureLog('error', 'Blockchain connection failed', { error: networkError.message });

      // Return generic error in production for security
      const isDevMode = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: 'Blockchain service temporarily unavailable',
          ...(isDevMode && {
            details: networkError.message,
            code: networkError.code
          })
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

    secureLog('info', 'Starting mint transaction');

    // Execute mint transaction with comprehensive error handling
    try {
      secureLog('info', 'Estimating transaction gas');

      // Gas estimation with timeout
      const gasEstimatePromise = contract.mint.estimateGas(pA, pB, pC, nullifierBigInt);
      const gasTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gas estimation timeout')), 20000)
      );

      const gasEstimate = await Promise.race([gasEstimatePromise, gasTimeoutPromise]);
      const gasLimit = gasEstimate * 125n / 100n; // 25% buffer for safety

      secureLog('info', 'Submitting mint transaction');
      const tx = await contract.mint(pA, pB, pC, nullifierBigInt, {
        gasLimit: gasLimit,
        // Add gas price for better transaction inclusion in production
        ...(process.env.NODE_ENV === 'production' && {
          maxFeePerGas: ethers.parseUnits('2', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        })
      });

      secureLog('info', 'Waiting for transaction confirmation', { txHash: tx.hash });

      // Wait for confirmation with timeout
      const receiptPromise = tx.wait();
      const confirmTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
      );

      const receipt = await Promise.race([receiptPromise, confirmTimeoutPromise]);

      // Verify the transaction was successful
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on-chain');
      }

      // Fetch post-mint data securely
      secureLog('info', 'Fetching trust score');

      const trustScorePromise = contract.viewTrustScore(normalizedAddress);
      const scoreTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Trust score fetch timeout')), 10000)
      );

      const trustScore = await Promise.race([trustScorePromise, scoreTimeoutPromise]);

      const result = {
        success: true,
        transactionHash: receipt.hash,
        trustScore: trustScore.toString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      };

      secureLog('info', 'Mint completed successfully', { txHash: receipt.hash });
      return NextResponse.json(result);
    } catch (mintError: any) {
      secureLog('error', 'Mint transaction failed', { error: mintError.message });

      // Secure error classification
      const isDevMode = process.env.NODE_ENV === 'development';

      if (mintError.message?.includes('execution reverted')) {
        const secureReason = isDevMode ? (mintError.reason || 'Contract rejection') : 'Transaction rejected';

        // Special handling for "already minted" case
        if (mintError.reason?.includes('Already minted')) {
          return NextResponse.json(
            {
              error: 'PoEP already exists',
              reason: 'You already have a PoEP passport for this wallet address',
              code: 'ALREADY_MINTED'
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            error: 'Smart contract rejected the transaction',
            reason: secureReason,
            code: 'CONTRACT_REVERT'
          },
          { status: 400 }
        );
      }

      if (mintError.code === 'UNPREDICTABLE_GAS_LIMIT' || mintError.message?.includes('gas')) {
        return NextResponse.json(
          {
            error: 'Transaction would fail',
            reason: 'Invalid proof or insufficient funds',
            code: 'SIMULATION_FAILED'
          },
          { status: 400 }
        );
      }

      if (mintError.message?.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Transaction timeout',
            reason: 'Network congestion - please try again',
            code: 'TIMEOUT'
          },
          { status: 408 }
        );
      }

      // Re-throw for general error handler
      throw mintError;
    }

  } catch (error: any) {
    secureLog('error', 'Unhandled minting error', { error: error.message });

    // Secure error response with minimal information exposure
    const isDevMode = process.env.NODE_ENV === 'development';

    // Classify error types securely
    let errorType = 'UNKNOWN';
    let userMessage = 'Minting service temporarily unavailable';
    let statusCode = 500;

    if (error.message?.includes('insufficient funds')) {
      errorType = 'INSUFFICIENT_FUNDS';
      userMessage = 'Insufficient ETH for transaction fees';
      statusCode = 400;
    } else if (error.message?.includes('network') || error.message?.includes('connection')) {
      errorType = 'NETWORK_ERROR';
      userMessage = 'Network connectivity issue';
      statusCode = 503;
    } else if (error.message?.includes('timeout')) {
      errorType = 'TIMEOUT';
      userMessage = 'Request timed out - please try again';
      statusCode = 408;
    } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      errorType = 'VALIDATION_ERROR';
      userMessage = 'Invalid request parameters';
      statusCode = 400;
    }

    return NextResponse.json(
      {
        error: userMessage,
        code: errorType,
        timestamp: new Date().toISOString(),
        ...(isDevMode && {
          debug: {
            message: error.message,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 5)
          }
        })
      },
      { status: statusCode }
    );
  }
}

// Handle preflight requests with security headers
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Validate origin in production
  const allowedOrigins = [
    'https://warpcast.com',
    'https://farcaster.xyz',
    'https://base.org',
    'https://coinbase.com'
  ];

  const isAllowedOrigin = isDevelopment ||
    !origin ||
    allowedOrigins.some(allowed =>
      origin === allowed ||
      origin.endsWith(`.${allowed.replace('https://', '')}`)
    );

  if (!isAllowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isDevelopment ? '*' : (origin || 'https://warpcast.com'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Real-IP, X-Forwarded-For',
      'Access-Control-Max-Age': '3600',
      'Vary': 'Origin',
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