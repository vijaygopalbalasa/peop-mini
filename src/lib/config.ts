export const POEP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS as `0x${string}`;

if (!POEP_CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_POEP_CONTRACT_ADDRESS environment variable is required');
}
export const NEXT_PUBLIC_CDP_API_KEY = process.env.NEXT_PUBLIC_CDP_API_KEY || '';
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || vercelUrl;

if (!NEXT_PUBLIC_URL) {
  throw new Error('NEXT_PUBLIC_URL environment variable is required');
}
