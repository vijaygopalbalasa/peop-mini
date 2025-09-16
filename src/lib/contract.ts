import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { POEP_CONTRACT_ABI } from './constants';
import { POEP_CONTRACT_ADDRESS } from './config';

const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;

// Prefer explicit RPC URLs for stability if provided
const rpcUrl =
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_BASE_RPC_URL || undefined)
    : (process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || undefined);

const publicClient = createPublicClient({
  chain,
  transport: rpcUrl ? http(rpcUrl) : http(),
});

export async function hasPassport(address: string): Promise<boolean> {
  try {
    const result = await (publicClient as any).readContract({
      address: POEP_CONTRACT_ADDRESS,
      abi: POEP_CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return BigInt(result as any) > 0n;
  } catch (error) {
    console.error('Error checking passport:', error);
    return false;
  }
}

export async function getTrustScore(address: `0x${string}`): Promise<number> {
  try {
    const score = await (publicClient as any).readContract({
      address: POEP_CONTRACT_ADDRESS,
      abi: POEP_CONTRACT_ABI,
      functionName: 'viewTrustScore',
      args: [address],
    });
    return Number(score);
  } catch (error) {
    console.error('Error getting trust score:', error);
    throw new Error('Failed to read trust score');
  }
}

export const generateZKProof = async (faceHash: string, nonce?: string, userAddress?: string) => {
  // Real ZK proof generation using snarkjs (loaded via script tag in layout)
  const snarkjs = (window as any).snarkjs;
  if (!snarkjs) throw new Error('snarkjs not loaded');

  // Generate nonce if not provided
  const actualNonce = nonce || crypto.getRandomValues(new Uint8Array(32)).reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''
  );

  // Get user's first transaction hash via secure API route
  let firstTxHash: string;
  if (userAddress) {
    try {
      const response = await fetch('/api/get-first-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress })
      });
      const data = await response.json();

      if (response.ok && data.txHash) {
        firstTxHash = data.txHash;
      } else {
        // Fallback: use deterministic hash based on address
        const addressHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userAddress.toLowerCase()));
        const hashArray = Array.from(new Uint8Array(addressHash));
        firstTxHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      // Fallback: use deterministic hash based on address
      const addressHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userAddress.toLowerCase()));
      const hashArray = Array.from(new Uint8Array(addressHash));
      firstTxHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } else {
    throw new Error('User address is required for ZK proof generation');
  }

  // Prepare inputs for the 3-input circuit
  const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

  let faceHashBigInt = BigInt(faceHash);
  let firstTxHashBigInt = BigInt(firstTxHash);
  let nonceBigInt = BigInt('0x' + actualNonce);

  // Reduce to field size if necessary
  if (faceHashBigInt >= fieldSize) faceHashBigInt = faceHashBigInt % fieldSize;
  if (firstTxHashBigInt >= fieldSize) firstTxHashBigInt = firstTxHashBigInt % fieldSize;
  if (nonceBigInt >= fieldSize) nonceBigInt = nonceBigInt % fieldSize;

  const inputs = {
    faceHash: faceHashBigInt.toString(),
    firstTxHash: firstTxHashBigInt.toString(),
    nonce: nonceBigInt.toString(),
  } as any;

  const wasmPath = '/circuit.wasm';
  const zkeyPath = '/circuit_final.zkey';

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);

  const pA = [proof.pi_a[0], proof.pi_a[1]] as const;
  const pB = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]],
  ] as const;
  const pC = [proof.pi_c[0], proof.pi_c[1]] as const;
  const nullifier = publicSignals[0];

  return { pA, pB, pC, nullifier };
};
