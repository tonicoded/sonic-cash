#!/bin/bash

# Compile Circom circuits for Sonic Privacy Pool
echo "🔄 Compiling Circom circuits..."

# Create build directory
mkdir -p build

# Compile withdrawal circuit
echo "📝 Compiling withdrawal circuit..."
circom withdrawal.circom --r1cs --wasm --sym --c -o build/

# Generate witness
echo "🔍 Generating witness..."
cd build/withdrawal_js
node generate_witness.js withdrawal.wasm ../../test/input.json witness.wtns

# Generate PLONK setup (ceremony would be needed for production)
echo "🔐 Generating PLONK setup..."
cd ../..
snarkjs plonk setup build/withdrawal.r1cs pot12_final.ptau build/withdrawal_final.zkey

# Generate verification key
echo "🔑 Generating verification key..."
snarkjs zkey export verificationkey build/withdrawal_final.zkey build/verification_key.json

# Export verifier contract
echo "📄 Generating Solidity verifier..."
snarkjs zkey export solidityverifier build/withdrawal_final.zkey ../contracts/contracts/Verifier.sol

# Generate WASM for browser
echo "🌐 Preparing WASM for browser..."
cp build/withdrawal_js/withdrawal.wasm ../frontend/public/
cp build/withdrawal_final.zkey ../frontend/public/

echo "✅ Circuit compilation complete!"
echo "📦 Files generated:"
echo "  - build/withdrawal.r1cs (R1CS constraint system)"
echo "  - build/withdrawal_js/withdrawal.wasm (WASM for browser)"
echo "  - build/withdrawal_final.zkey (Proving key)"
echo "  - build/verification_key.json (Verification key)"
echo "  - ../contracts/contracts/Verifier.sol (Solidity verifier)"