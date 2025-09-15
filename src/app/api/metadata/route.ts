import { NextRequest, NextResponse } from 'next/server';
import PoEPMetadataManager from '~/ipfs/metadata-manager';

/**
 * Dynamic NFT Metadata API Endpoint
 *
 * This endpoint serves dynamic NFT metadata that updates based on trust scores.
 * It's designed to work with the PoEP contract's tokenURI function which
 * appends ?score=X to the metadata URL.
 *
 * Example usage:
 * GET /api/metadata?score=25 -> Returns Bronze tier metadata
 * GET /api/metadata?score=75 -> Returns Silver tier metadata
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreParam = searchParams.get('score');
    const tokenId = searchParams.get('tokenId');

    // Parse and validate score
    let trustScore = 1; // Default score
    if (scoreParam) {
      const parsedScore = parseInt(scoreParam, 10);
      if (!isNaN(parsedScore) && parsedScore >= 0) {
        trustScore = parsedScore;
      }
    }

    // Initialize metadata manager
    const metadataManager = new PoEPMetadataManager();

    // Generate dynamic metadata based on trust score
    const metadata = metadataManager.generateMetadata(trustScore);

    // Add additional context for better OpenSea support
    metadata.external_url = `${process.env.NEXT_PUBLIC_URL}`;
    metadata.animation_url = undefined; // No animation for this version

    // Add tokenId to attributes if provided
    if (tokenId) {
      metadata.attributes.push({
        trait_type: "Token ID",
        value: parseInt(tokenId, 10),
        display_type: "number"
      });
    }

    // Set proper headers for NFT metadata
    const response = NextResponse.json(metadata);
    response.headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    response.headers.set('Content-Type', 'application/json');

    return response;

  } catch (error) {
    console.error('Metadata API error:', error);

    // Return minimal fallback metadata
    const fallbackMetadata = {
      name: "PoEP - Proof-of-Existence Passport",
      description: "A soul-bound NFT that proves unique human identity using zero-knowledge proofs.",
      image: `${process.env.NEXT_PUBLIC_URL}/images/poep-standard.svg`,
      external_url: `${process.env.NEXT_PUBLIC_URL}`,
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
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Health check endpoint
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  });
}

/**
 * Options for CORS if needed
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=86400' // 24 hours
    }
  });
}