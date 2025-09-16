import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Validate JWT token with Farcaster's auth server
    const validationResponse = await fetch('https://auth.farcaster.xyz/v1/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!validationResponse.ok) {
      return NextResponse.json(
        { error: 'Token validation failed' },
        { status: 401 }
      );
    }

    const validationData = await validationResponse.json();

    // Extract user data from validated token
    const payload = JSON.parse(atob(token.split('.')[1]));

    return NextResponse.json({
      user: {
        fid: payload.sub,
        ...validationData.user
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}