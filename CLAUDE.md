# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sonic Privacy Pool** - A privacy-focused dApp on Sonic blockchain that enables anonymous token transfers using ZK-proofs and Merkle commitments. Think Tornado Cash but built for Sonic's speed and low fees.

### Key Architecture Components

- **Frontend**: Next.js + Tailwind + Wagmi (deployed on Vercel)
- **Smart Contracts**: Solidity contracts on Sonic EVM (PrivacyPool.sol + Verifier.sol)
- **ZK Circuits**: Circom v2 + snarkjs for PLONK proofs
- **Hash Function**: Poseidon for efficient ZK-friendly hashing
- **No Backend**: Fully client-side + on-chain architecture

## Project Structure

```
/
├── contracts/          # Solidity smart contracts
├── circuits/           # Circom ZK circuits
├── frontend/          # Next.js application
├── scripts/           # Deployment and utility scripts
└── docs/             # Technical documentation
```

## Common Commands

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Start local development
npm run dev

# Build all components
npm run build
```

### Smart Contracts (Hardhat)
```bash
# Compile contracts
npm run contracts:compile

# Deploy to Sonic testnet
npm run contracts:deploy:testnet

# Run contract tests
npm run contracts:test

# Verify contracts
npm run contracts:verify
```

### ZK Circuits
```bash
# Compile circuits
npm run circuits:compile

# Generate PLONK setup
npm run circuits:setup

# Generate verifier contract
npm run circuits:verifier
```

### Frontend
```bash
# Start frontend dev server
npm run frontend:dev

# Build for production
npm run frontend:build

# Deploy to Vercel
npm run frontend:deploy
```

## Development Workflow

1. **Contracts First**: Deploy and verify smart contracts on Sonic testnet
2. **Circuits**: Generate and test ZK circuits with snarkjs
3. **Frontend**: Build UI with wallet integration and proof generation
4. **Integration**: End-to-end testing of deposit/withdraw flow

## Key Technical Patterns

- **Event-Based Merkle Tree**: Frontend builds tree from Deposit events (no backend)
- **Browser Proof Generation**: snarkjs WASM for client-side proving
- **Nullifier Pattern**: Prevent double-spending via unique nullifiers
- **Fixed Denominations**: MVP uses 1 S token per note for simplicity

## Sonic Network Configuration

- **Testnet RPC**: https://rpc.testnet.soniclabs.org
- **Mainnet RPC**: https://rpc.soniclabs.org
- **Block Explorer**: https://testnet.sonicscan.org

## Security Considerations

- All proofs generated client-side
- No custodial components
- Nullifier prevents double-spending
- Optional compliance features (view keys)
- Code audit required before mainnet