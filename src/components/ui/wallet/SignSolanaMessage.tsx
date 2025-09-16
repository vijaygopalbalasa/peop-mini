"use client";

interface SignSolanaMessageProps {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

/**
 * SignSolanaMessage component placeholder.
 *
 * This component was removed as PoEP is focused on Ethereum/Base chains only.
 * All Solana functionality has been removed in favor of the main PoEP flow.
 *
 * For message signing functionality, use the EVM signing components.
 */
export function SignSolanaMessage({ signMessage }: SignSolanaMessageProps) {
  return (
    <div className="text-center text-gray-500 text-sm">
      Solana functionality removed - use EVM signing
    </div>
  );
}