// Environment-specific contract addresses
const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

export const POEP_CONTRACT_ADDRESS = (isProduction
  ? process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_MAINNET
  : process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_SEPOLIA
) as `0x${string}`;

export const POEP_VERIFIER_CONTRACT_ADDRESS = (isProduction
  ? process.env.NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS_MAINNET
  : process.env.NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS_SEPOLIA
) as `0x${string}`;

if (!POEP_CONTRACT_ADDRESS) {
  const requiredVar = isProduction
    ? 'NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_MAINNET'
    : 'NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_SEPOLIA';

  if (typeof window === 'undefined') {
    // Server-side: just warn, don't crash the build
    console.warn(`Warning: ${requiredVar} environment variable is not set`);
  } else {
    // Client-side: throw error for user feedback
    throw new Error(`${requiredVar} environment variable is required`);
  }
}
export const NEXT_PUBLIC_CDP_API_KEY = process.env.NEXT_PUBLIC_CDP_API_KEY || '';
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || vercelUrl;

if (!NEXT_PUBLIC_URL) {
  throw new Error('NEXT_PUBLIC_URL environment variable is required');
}
