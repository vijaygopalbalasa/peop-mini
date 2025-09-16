import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const POEP_CONTRACT_ADDRESS = process.env.POEP_CONTRACT_ADDRESS;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter required' },
        { status: 400 }
      );
    }

    if (!POEP_CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract configuration missing' },
        { status: 500 }
      );
    }

    // Connect to Base network
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

    // Load contract ABI
    const contractABI = [
      "function hasPoEP(address user) external view returns (bool)",
      "function getTrustScore(address user) external view returns (uint256)",
      "function getPoEPOwner(uint256 fid) external view returns (address)"
    ];

    const contract = new ethers.Contract(POEP_CONTRACT_ADDRESS, contractABI, provider);

    // Get user address from FID (this would need proper resolution in production)
    let userAddress: string;
    try {
      userAddress = await contract.getPoEPOwner(fid);
    } catch {
      // If no address found for FID, user doesn't have PoEP
      return NextResponse.json({
        hasPoEP: false,
        trustScore: 0
      });
    }

    // Check if user has PoEP and get trust score
    const [hasPoEP, trustScore] = await Promise.all([
      contract.hasPoEP(userAddress),
      contract.getTrustScore(userAddress)
    ]);

    return NextResponse.json({
      hasPoEP,
      trustScore: trustScore.toString(),
      userAddress
    });

  } catch (error) {
    console.error('Check PoEP error:', error);
    return NextResponse.json(
      { error: 'Failed to check PoEP status' },
      { status: 500 }
    );
  }
}