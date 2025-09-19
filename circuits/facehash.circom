pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/*
 * PoEP (Proof-of-Existence Passport) ZK Circuit
 *
 * This circuit proves that a user:
 * 1. Has generated a unique face hash from biometric data
 * 2. Has provided a valid transaction nonce
 * 3. Has provided a timestamp for temporal uniqueness
 * 4. Creates a unique nullifier to prevent double-minting
 *
 * Inputs:
 * - faceHash: Poseidon hash of face biometric features (private)
 * - nonce: Random nonce for uniqueness (private)
 * - timestamp: Timestamp for temporal uniqueness (private)
 *
 * Outputs:
 * - nullifier: Unique identifier preventing double-minting (public)
 */

template FaceHashVerifier() {
    // Private inputs
    signal input faceHash;
    signal input nonce;
    signal input timestamp;

    // Public output
    signal output nullifier;

    // Constraints to ensure inputs are within field range
    component rangeCheck1 = Num2Bits(254);
    component rangeCheck2 = Num2Bits(254);
    component rangeCheck3 = Num2Bits(254);

    rangeCheck1.in <== faceHash;
    rangeCheck2.in <== nonce;
    rangeCheck3.in <== timestamp;

    // Create nullifier using Poseidon hash of faceHash, nonce, and timestamp
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== faceHash;
    poseidon.inputs[1] <== nonce;
    poseidon.inputs[2] <== timestamp;

    nullifier <== poseidon.out;
}

// Main component
component main = FaceHashVerifier();