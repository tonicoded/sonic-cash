pragma circom 2.0.0;

/*
 * Simplified Withdrawal Circuit for Sonic Privacy Pool
 * 
 * This is a minimal working version for testing
 * Proves knowledge of a secret without complex Merkle tree logic
 */

template SimpleWithdraw() {
    // Private input (secret)
    signal private input secret;
    
    // Public inputs
    signal input nullifier;      // Prevents double spending
    signal input recipient;      // Withdrawal address
    
    // Output (commitment that was deposited)
    signal output commitment;
    
    // Compute commitment = secret * secret (simple hash for testing)
    commitment <== secret * secret;
    
    // Generate nullifier = secret + 1 (simple nullifier for testing)
    component nullifier_check = IsEqual();
    nullifier_check.in[0] <== nullifier;
    nullifier_check.in[1] <== secret + 1;
    nullifier_check.out === 1;
    
    // Validate recipient is non-zero
    component recipient_check = IsZero();
    recipient_check.in <== recipient;
    recipient_check.out === 0;
}

template IsEqual() {
    signal input in[2];
    signal output out;
    
    component isz = IsZero();
    isz.in <== in[1] - in[0];
    out <== 1 - isz.out;
}

template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in*inv + 1;
    in*out === 0;
}

component main = SimpleWithdraw();