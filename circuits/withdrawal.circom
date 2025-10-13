pragma circom 2.1.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/merkletree.circom";
include "circomlib/circuits/bitify.circom";

/*
 * Withdrawal Circuit for Sonic Privacy Pool
 * 
 * Proves:
 * 1. Knowledge of a secret that corresponds to a commitment in the Merkle tree
 * 2. Generates a unique nullifier to prevent double-spending
 * 3. Validates the recipient and fee amounts
 */

template Withdrawal() {
    // Merkle tree depth (supports 2^20 = ~1M deposits)
    var levels = 20;
    
    // Private inputs (known only to the prover)
    signal private input secret;          // Random secret for commitment
    signal private input nullifier_secret; // Secret for nullifier generation
    signal private input path_elements[levels]; // Merkle proof path
    signal private input path_indices[levels];  // Merkle proof indices (0 or 1)
    
    // Public inputs (known to everyone)
    signal input root;           // Merkle tree root
    signal input nullifier;      // Unique nullifier hash
    signal input recipient;      // Recipient address
    signal input fee;           // Relayer fee
    
    // Outputs
    signal output commitment;    // Commitment being spent
    
    // 1. Compute commitment from secret
    component commitment_hasher = Poseidon(2);
    commitment_hasher.inputs[0] <== secret;
    commitment_hasher.inputs[1] <== nullifier_secret;
    commitment <== commitment_hasher.out;
    
    // 2. Verify commitment is in Merkle tree
    component merkle_proof = MerkleTreeChecker(levels);
    merkle_proof.leaf <== commitment;
    merkle_proof.root <== root;
    
    for (var i = 0; i < levels; i++) {
        merkle_proof.pathElements[i] <== path_elements[i];
        merkle_proof.pathIndices[i] <== path_indices[i];
    }
    
    // 3. Generate and verify nullifier
    component nullifier_hasher = Poseidon(2);
    nullifier_hasher.inputs[0] <== secret;
    nullifier_hasher.inputs[1] <== 1; // Domain separator for nullifier
    nullifier_hasher.out === nullifier;
    
    // 4. Validate recipient (must be a valid address)
    component recipient_bits = Num2Bits(160); // Ethereum address is 160 bits
    recipient_bits.in <== recipient;
    
    // 5. Validate fee (must be reasonable)
    component fee_check = LessThan(64);
    fee_check.in[0] <== fee;
    fee_check.in[1] <== 1000000000000000000; // Max 1 ether fee
    fee_check.out === 1;
}

/*
 * Merkle Tree Checker Component
 * Verifies that a leaf exists in a Merkle tree with given root
 */
template MerkleTreeChecker(n) {
    signal input leaf;
    signal input root;
    signal input pathElements[n];
    signal input pathIndices[n];
    
    component selectors[n];
    component hashers[n];
    
    for (var i = 0; i < n; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i-1].out;
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
    }
    
    root === hashers[n-1].out;
}

/*
 * Dual Multiplexer
 * Outputs [in[s], in[1-s]] based on selector s
 */
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];
    
    s * (1 - s) === 0; // Ensure s is 0 or 1
    
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

/*
 * Less Than Component  
 * Checks if in[0] < in[1]
 */
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component lt = Num2Bits(n + 1);
    lt.in <== in[0] + (1 << n) - in[1];
    
    out <== 1 - lt.out[n];
}

// Main component
component main = Withdrawal();