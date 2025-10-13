# 🔒 Sonic Privacy Pool

A privacy-focused dApp for anonymous token transfers on Sonic blockchain using Zero-Knowledge proofs.

![Sonic Privacy Pool](https://img.shields.io/badge/Privacy-First-6366f1?style=flat-square) ![Sonic](https://img.shields.io/badge/Built%20on-Sonic-0ea5e9?style=flat-square) ![ZK](https://img.shields.io/badge/Zero--Knowledge-Proofs-764ba2?style=flat-square)

## 🎯 Overview

Sonic Privacy Pool enables users to send S tokens anonymously using cutting-edge zero-knowledge proof technology. The protocol is fully decentralized, non-custodial, and operates entirely on-chain.

### Key Features

- 🔒 **Complete Privacy**: Anonymous transfers using ZK-SNARKs
- ⚡ **Sonic Speed**: Fast transactions with minimal fees
- 🛡️ **Non-Custodial**: You control your funds at all times
- 🌐 **No Backend**: Fully client-side proof generation
- 🔓 **Open Source**: Transparent and auditable code

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart          │    │   ZK Circuits   │
│   (Next.js)     │◄──►│  Contracts      │◄──►│   (Circom)      │
│                 │    │  (Solidity)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐             │
        └─────────────►│  Sonic Network  │◄────────────┘
                       │   (EVM Layer)   │
                       └─────────────────┘
```

### Components

- **Frontend**: Next.js app with wallet integration and proof generation
- **Smart Contracts**: PrivacyPool.sol, Verifier.sol, PoseidonHasher.sol
- **ZK Circuits**: Circom circuits for withdrawal proofs
- **Sonic Network**: Fast, low-cost EVM-compatible blockchain

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Circom 2.1+
- snarkjs

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sonic-privacy-pool
   cd sonic-privacy-pool
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Compile circuits**
   ```bash
   npm run circuits:compile
   npm run circuits:setup
   npm run circuits:verifier
   ```

5. **Deploy contracts**
   ```bash
   npm run contracts:deploy:testnet
   ```

6. **Start frontend**
   ```bash
   npm run frontend:dev
   ```

Visit `http://localhost:3000` to see the app!

## 💻 Development

### Project Structure

```
/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/      # Solidity files
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
├── circuits/           # ZK circuits (Circom)
│   ├── scripts/        # Circuit compilation
│   └── test/           # Circuit tests
├── frontend/           # Next.js application
│   ├── src/app/        # App router pages
│   ├── src/components/ # React components
│   └── src/lib/        # Utilities and crypto
└── scripts/            # Build and deployment scripts
```

### Development Commands

```bash
# Full development environment
npm run dev

# Build all components
npm run build

# Run all tests
npm run test

# Lint and format code
npm run lint
npm run format

# Deploy to testnet
npm run contracts:deploy:testnet

# Deploy frontend to Vercel
npm run frontend:deploy
```

### Smart Contract Development

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sonic testnet
npx hardhat run scripts/deploy.js --network sonic-testnet

# Verify contracts
npx hardhat verify <CONTRACT_ADDRESS> --network sonic-testnet
```

### Circuit Development

```bash
cd circuits

# Compile circuit
./compile.sh

# Run setup ceremony
node scripts/setup.js

# Generate verifier contract
node scripts/generate-verifier.js

# Test circuit
circom withdrawal.circom --r1cs --wasm --sym
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRIVATE_KEY` | Private key for deployment | Yes |
| `SONIC_TESTNET_RPC` | Sonic testnet RPC URL | Yes |
| `NEXT_PUBLIC_PRIVACY_POOL_ADDRESS` | Deployed pool address | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | No |

### Network Configuration

The app supports both Sonic testnet and mainnet:

- **Testnet**: Chain ID 64165, RPC https://rpc.testnet.soniclabs.org
- **Mainnet**: Chain ID 146, RPC https://rpc.soniclabs.org

## 🔒 Security

### Privacy Guarantees

- **Anonymity Set**: Your transaction is mixed with all other deposits
- **Zero Knowledge**: Proofs reveal nothing about your identity
- **Client-Side**: All proof generation happens in your browser
- **Non-Custodial**: Smart contracts hold funds, not people

### Security Considerations

- ⚠️ **Alpha Software**: This is experimental technology
- 🔑 **Secret Notes**: Loss of secret note means loss of funds
- 🛡️ **Audit Status**: Contracts should be audited before mainnet
- 🔍 **Trusted Setup**: Ceremony required for production PLONK

## 📖 How It Works

### Deposit Flow

1. **Generate Secret**: Create random secret note
2. **Create Commitment**: Compute Poseidon hash commitment
3. **Send Transaction**: Deposit S tokens to privacy pool
4. **Save Note**: Securely store your secret note

### Withdrawal Flow

1. **Load Secret**: Import your secret note
2. **Generate Proof**: Create ZK proof of valid withdrawal
3. **Submit Transaction**: Withdraw to any address anonymously
4. **Receive Funds**: Tokens sent to recipient address

### Technical Details

- **Denomination**: Fixed 1 S token per note (MVP)
- **Merkle Tree**: 20 levels supporting 1M+ deposits  
- **Hash Function**: Poseidon (ZK-friendly)
- **Proof System**: PLONK (smaller proofs than Groth16)
- **Gas Cost**: ~200K gas per withdrawal

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test contracts only
npm run contracts:test

# Test circuits only
cd circuits && npm test

# Test frontend only
cd frontend && npm run test

# Integration tests
npm run test:integration
```

## 🚢 Deployment

### Testnet Deployment

```bash
# Deploy contracts
npm run contracts:deploy:testnet

# Deploy frontend
npm run frontend:deploy

# Verify deployment
npm run verify
```

### Mainnet Deployment

```bash
# Audit contracts first!
# Run security checklist
# Perform trusted setup ceremony

npm run contracts:deploy:mainnet
npm run frontend:deploy
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sonic Labs** - For the fast, low-cost blockchain
- **Tornado Cash** - Privacy protocol inspiration  
- **Circom & snarkjs** - ZK proof tooling
- **OpenZeppelin** - Smart contract security

## 📞 Support

- **Documentation**: [docs.sonic-privacy.xyz](https://docs.sonic-privacy.xyz)
- **Discord**: [Join our community](https://discord.gg/sonic-privacy)
- **GitHub Issues**: [Report bugs](https://github.com/sonic-privacy-pool/issues)
- **Email**: security@sonic-privacy.xyz

---

<div align="center">

**🌊 Built with privacy in mind on Sonic blockchain**

[Website](https://privacy.sonic.xyz) • [Docs](https://docs.sonic-privacy.xyz) • [Discord](https://discord.gg/sonic-privacy) • [Twitter](https://twitter.com/sonic_privacy)

</div>