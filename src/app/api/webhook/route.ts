import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple webhook endpoint for PoEP Mini App
 *
 * This endpoint can receive webhook events from Farcaster frames
 * and handle them appropriately for the PoEP application.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the webhook event for debugging
    console.log('Webhook received:', {
      timestamp: new Date().toISOString(),
      event: body
    });

    // For PoEP, we might want to handle events like:
    // - Frame interactions
    // - Cast interactions
    // - User authentication events

    // Simple response to acknowledge the webhook
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully'
    });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json({
      success: false,
      message: 'Webhook processing failed'
    }, {
      status: 500
    });
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    status: 'healthy',
    service: 'PoEP Mini App Webhook',
    timestamp: new Date().toISOString()
  });
}