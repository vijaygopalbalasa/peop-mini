import { NextResponse } from 'next/server';
import { getBaseMiniAppManifest } from '~/lib/utils';

export async function GET() {
  try {
    const config = await getBaseMiniAppManifest();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json({ error: 'Failed to generate metadata' }, { status: 500 });
  }
}
