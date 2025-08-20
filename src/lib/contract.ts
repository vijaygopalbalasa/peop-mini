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
    const result = await publicClient.readContract({
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
    const score = await publicClient.readContract({
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

export const generateZKProof = async () => {
  // Real ZK proof generation using snarkjs (loaded via script tag in layout)
  const snarkjs = (window as any).snarkjs;
  if (!snarkjs) throw new Error('snarkjs not loaded');

  // Example inputs (replace with real signals as your circuit expects)
  const rand = (n: number) => {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return BigInt('0x' + hex);
  };

  const inputs = {
    faceHash: rand(31),
    firstTxHash: rand(31),
    nonce: rand(31),
  } as any;

  const wasmPath = '/circuit.wasm';
  const zkeyPath = '/circuit_final.zkey';

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);

  const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as const;
  const pB = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ] as const;
  const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as const;
  const nullifier = BigInt(publicSignals[0]);

  return { pA, pB, pC, nullifier };
};
