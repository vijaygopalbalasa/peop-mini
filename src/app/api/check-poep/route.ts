import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Environment-specific contract addresses
const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

const POEP_CONTRACT_ADDRESS = isProduction
  ? process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_MAINNET
  : process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_SEPOLIA;

const BASE_RPC_URL = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter required' },
        { status: 400 }
      );
    }

    // Validate and normalize the address
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(address);
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    if (!POEP_CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract configuration missing' },
        { status: 500 }
      );
    }

    console.log('[CHECK-POEP] Checking PoEP status for:', normalizedAddress);
    console.log('[CHECK-POEP] Contract address:', POEP_CONTRACT_ADDRESS);
    console.log('[CHECK-POEP] RPC URL:', BASE_RPC_URL);

    // Connect to Base network
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

    // Load contract ABI with correct function signatures
    const contractABI = [
      "function balanceOf(address owner) external view returns (uint256)",
      "function viewTrustScore(address user) external view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)"
    ];

    const contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, contractABI, provider);

    // In PoEP contract, tokenId = uint256(uint160(userAddress))
    // So we can directly check if the token exists for this address
    const tokenId = BigInt(normalizedAddress);
    console.log('[CHECK-POEP] Calculated tokenId:', tokenId.toString());

    let hasPoEP = false;
    let owner = null;
    try {
      // Try to get the owner of the tokenId derived from the address
      owner = await contract.ownerOf(tokenId);
      console.log('[CHECK-POEP] Owner of tokenId:', owner);
      hasPoEP = owner.toLowerCase() === normalizedAddress.toLowerCase();
      console.log('[CHECK-POEP] hasPoEP:', hasPoEP);
    } catch (error) {
      console.log('[CHECK-POEP] ownerOf failed (token does not exist):', error.message);
      hasPoEP = false;
    }

    // Also check balanceOf for verification
    console.log('[CHECK-POEP] Calling balanceOf...');
    const balance = await contract.balanceOf(normalizedAddress);
    console.log('[CHECK-POEP] Balance result:', balance.toString());

    let trustScore = 0;
    let returnTokenId = null;
    if (hasPoEP) {
      try {
        // Get trust score using viewTrustScore (view function, no fee)
        const score = await contract.viewTrustScore(normalizedAddress);
        trustScore = parseInt(score.toString());
        console.log('[CHECK-POEP] Trust score:', trustScore);

        // Use the calculated tokenId (convert BigInt to string)
        returnTokenId = tokenId.toString();
      } catch (_error) {
        console.log('[CHECK-POEP] Error fetching trust score:', _error.message);
        // Default to 0 if can't fetch
        trustScore = 0;
        returnTokenId = null;
      }
    }

    const result = {
      hasPoEP,
      trustScore,
      balance: balance.toString(),
      tokenId: returnTokenId,
      userAddress: normalizedAddress
    };

    console.log('[CHECK-POEP] Final result:', JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // Serialize the result with BigInt handling
    const jsonString = JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Check PoEP error:', error);
    return NextResponse.json(
      { error: 'Failed to check PoEP status' },
      { status: 500 }
    );
  }
}