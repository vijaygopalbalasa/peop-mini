pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template SimpleHash() {
    signal private input faceHash;
    signal private input nonce;
    signal output nullifier;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== faceHash;
    poseidon.inputs[1] <== nonce;

    nullifier <== poseidon.out;
}

component main = SimpleHash();