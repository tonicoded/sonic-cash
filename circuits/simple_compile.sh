#!/bin/bash

# Simple compile script for basic testing
echo "🔄 Compiling Simple Withdrawal Circuit..."

# Create build directory
mkdir -p build

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Installing..."
    
    # Install circom (simplified version)
    curl -L https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64 -o circom
    chmod +x circom
    sudo mv circom /usr/local/bin/ 2>/dev/null || mv circom /opt/homebrew/bin/ 2>/dev/null || echo "⚠️  Please install circom manually"
fi

# Check if snarkjs is installed globally
if ! command -v snarkjs &> /dev/null; then
    echo "📦 Installing snarkjs..."
    npm install -g snarkjs
fi

echo "📝 Compiling circuit..."
circom simple_withdraw.circom --r1cs --wasm --sym -o build/

if [ $? -eq 0 ]; then
    echo "✅ Circuit compiled successfully!"
    
    echo "🔧 Setting up PLONK..."
    cd build
    
    # Download a powers of tau file (for testing only)
    if [ ! -f "pot12_final.ptau" ]; then
        echo "📥 Downloading powers of tau..."
        curl -L https://hermez.s3-eu-west-1.amazonaws.com/pot12_final.ptau -o pot12_final.ptau
    fi
    
    # PLONK setup
    echo "🔐 Running PLONK setup..."
    snarkjs plonk setup simple_withdraw.r1cs pot12_final.ptau circuit_final.zkey
    
    # Export verification key
    echo "🔑 Exporting verification key..."
    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
    
    # Generate Solidity verifier
    echo "📄 Generating Solidity verifier..."
    snarkjs zkey export solidityverifier circuit_final.zkey ../Verifier.sol
    
    # Copy files for frontend
    echo "📂 Copying files for frontend..."
    cp simple_withdraw_js/simple_withdraw.wasm ../../test-frontend/
    cp circuit_final.zkey ../../test-frontend/
    cp verification_key.json ../../test-frontend/
    
    echo "🎉 Setup complete!"
    echo "Files generated:"
    echo "  - build/simple_withdraw.r1cs"
    echo "  - build/simple_withdraw_js/simple_withdraw.wasm"
    echo "  - build/circuit_final.zkey"
    echo "  - build/verification_key.json"
    echo "  - Verifier.sol"
    
else
    echo "❌ Circuit compilation failed"
    exit 1
fi