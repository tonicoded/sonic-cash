pragma circom 2.0.0;

template TestWithdraw() {
    signal input secret;
    signal input nullifier;
    signal input recipient;
    signal output commitment;
    
    commitment <== secret * secret;
    nullifier === secret + 1;
    
    signal recipient_squared;
    recipient_squared <== recipient * recipient;
}

component main = TestWithdraw();