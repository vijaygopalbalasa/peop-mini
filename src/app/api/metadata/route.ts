import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple NFT Metadata API for PoEP
 *
 * Serves dynamic NFT metadata based on trust scores without external dependencies
 */

function getTierFromScore(score: number): {
  tier: string;
  image: string;
  color: string;
} {
  if (score >= 100) {
    return {
      tier: 'Gold',
      image: '/images/poep-gold.svg',
      color: 'FFD700'
    };
  } else if (score >= 50) {
    return {
      tier: 'Silver',
      image: '/images/poep-silver.svg',
      color: 'C0C0C0'
    };
  } else if (score >= 25) {
    return {
      tier: 'Bronze',
      image: '/images/poep-bronze.svg',
      color: 'CD7F32'
    };
  } else {
    return {
      tier: 'Standard',
      image: '/images/poep-standard.svg',
      color: '1a1b23'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreParam = searchParams.get('score');
    const tokenId = searchParams.get('tokenId');

    // Parse trust score
    let trustScore = 1;
    if (scoreParam) {
      const parsedScore = parseInt(scoreParam, 10);
      if (!isNaN(parsedScore) && parsedScore >= 0) {
        trustScore = parsedScore;
      }
    }

    const { tier, image, color } = getTierFromScore(trustScore);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://poep-mini.vercel.app';

    const metadata = {
      name: `PoEP ${tier} #${tokenId || 'Unknown'}`,
      description: `A soul-bound NFT proving unique human identity with ${trustScore} trust score. Secured by zero-knowledge proofs and tied to Base transactions.`,
      image: `${baseUrl}${image}`,
      external_url: baseUrl,
      background_color: color,
      attributes: [
        {
          trait_type: "Trust Score",
          value: trustScore,
          display_type: "number"
        },
        {
          trait_type: "Tier",
          value: tier
        },
        {
          trait_type: "Type",
          value: "Soul-bound"
        },
        {
          trait_type: "Verification",
          value: "ZK Proof"
        },
        {
          trait_type: "Network",
          value: "Base"
        },
        {
          trait_type: "Privacy",
          value: "Preserved"
        }
      ]
    };

    // Add token ID if provided
    if (tokenId) {
      metadata.attributes.push({
        trait_type: "Token ID",
        value: parseInt(tokenId, 10),
        display_type: "number"
      });
    }

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Metadata API error:', error);

    const fallbackMetadata = {
      name: "PoEP - Proof-of-Existence Passport",
      description: "A soul-bound NFT that proves unique human identity using zero-knowledge proofs.",
      image: `${process.env.NEXT_PUBLIC_URL || 'https://poep-mini.vercel.app'}/images/poep-standard.svg`,
      external_url: process.env.NEXT_PUBLIC_URL || 'https://poep-mini.vercel.app',
      background_color: "1a1b23",
      attributes: [
        {
          trait_type: "Trust Score",
          value: 1,
          display_type: "number"
        },
        {
          trait_type: "Status",
          value: "Error Loading"
        }
      ]
    };

    return NextResponse.json(fallbackMetadata, {
      status: 200, // Return 200 even for errors to avoid NFT platform issues
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
  }
}