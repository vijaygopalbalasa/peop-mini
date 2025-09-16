import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Valid Ethereum address is required' },
        { status: 400 }
      );
    }

    if (!BASESCAN_API_KEY) {
      // Fallback to address-based hash if no API key
      const addressHash = Buffer.from(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address.toLowerCase()))
      );
      const fallbackHash = '0x' + Array.from(addressHash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return NextResponse.json({ txHash: fallbackHash });
    }

    // Query BaseScan API for user's first transaction
    const apiUrl = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${BASESCAN_API_KEY}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === '1' && data.result && data.result.length > 0) {
      const firstTx = data.result[0];
      return NextResponse.json({ txHash: firstTx.hash });
    }

    // Fallback: use deterministic hash based on address
    const addressHash = Buffer.from(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address.toLowerCase()))
    );
    const fallbackHash = '0x' + Array.from(addressHash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return NextResponse.json({ txHash: fallbackHash });

  } catch (error) {
    console.error('Error fetching first transaction:', error);

    // Return fallback hash on any error
    return NextResponse.json(
      { error: 'Failed to fetch transaction data' },
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