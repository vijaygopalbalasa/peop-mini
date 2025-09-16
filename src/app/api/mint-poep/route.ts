import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const POEP_CONTRACT_ADDRESS = process.env.POEP_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function POST(request: NextRequest) {
  try {
    const { proof, nullifier, userFid } = await request.json();

    if (!proof || !nullifier || !userFid) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Check if user already has a PoEP
    const userAddress = ethers.getAddress(userFid.toString()); // This would need proper address resolution
    const hasExisting = await contract.hasPoEP(userAddress);

    if (hasExisting) {
      return NextResponse.json(
        { error: 'PoEP already exists for this user' },
        { status: 409 }
      );
    }

    // Format proof for contract
    const formattedProof = [
      proof.proof.pi_a[0],
      proof.proof.pi_a[1],
      proof.proof.pi_b[0][1],
      proof.proof.pi_b[0][0],
      proof.proof.pi_b[1][1],
      proof.proof.pi_b[1][0],
      proof.proof.pi_c[0],
      proof.proof.pi_c[1]
    ];

    const publicSignals = [nullifier];

    // Submit transaction to mint PoEP
    const tx = await contract.mintPoEP(userAddress, formattedProof, publicSignals);
    const receipt = await tx.wait();

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
    return NextResponse.json(
      { error: 'Minting failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}