export const POEP_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS ||
  '0xDDaad7df1b101B8042792C7b54D2748C3220712f'
) as `0x${string}`;
export const NEXT_PUBLIC_CDP_API_KEY = process.env.NEXT_PUBLIC_CDP_API_KEY || '';
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
export const NEXT_PUBLIC_URL =
  process.env.NEXT_PUBLIC_URL || vercelUrl || 'http://localhost:3000';
