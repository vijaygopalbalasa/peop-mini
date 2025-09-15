import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '1';

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative"
           style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
           }}>
        <div tw="flex items-center justify-center w-64 h-64 bg-white rounded-full mb-8 shadow-2xl">
          <div tw="text-8xl">🔐</div>
        </div>
        <h1 tw="text-8xl text-white font-bold text-center">PoEP</h1>
        <p tw="text-4xl text-white opacity-90 text-center">Proof-of-Existence Passport</p>
        <div tw="flex items-center mt-8 bg-white bg-opacity-20 rounded-full px-8 py-4">
          <span tw="text-3xl text-white mr-4">Trust Score:</span>
          <span tw="text-5xl text-yellow-300 font-bold">{score}</span>
        </div>
        <p tw="text-2xl mt-6 text-white opacity-80">Privacy-first human verification on Base</p>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}