# PoEP - Proof-of-Existence Passport

**A privacy-first, soul-bound NFT that proves unique human identity using ZK-SNARKs on Base mainnet.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vijaygopalbalasa/peop-mini)
[![Base](https://img.shields.io/badge/Built%20on-Base-blue.svg)](https://base.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is PoEP?

PoEP (Proof-of-Existence Passport) is a revolutionary identity verification system that combines:

- **🔐 Zero-Knowledge Proofs**: Prove your humanity without revealing biometric data
- **🏆 Dynamic Trust Scoring**: Your reputation grows with every Base transaction
- **🔒 Soul-Bound NFTs**: Non-transferable, unique identity tokens
- **⚡ Base Integration**: Built for the Base ecosystem and Onchain Summer Awards

## 🚀 Key Features

### **Privacy-First Biometric Verification**
- Camera-based face capture (never leaves your device)
- ZK-SNARK proof generation using Circom circuits
- Poseidon hash for secure biometric processing

### **Intelligent Trust Scoring**
- Automatic score updates based on Base transactions
- Real-time blockchain indexing
- Sybil resistance through unique nullifiers

### **Farcaster Mini App**
- Seamless integration with Warpcast
- One-click passport minting
- Social proof and discovery

### **Dynamic NFT Metadata**
- IPFS-based metadata with score-dependent traits
- Tiered visual representation (Bronze, Silver, Gold)
- Real-time updates without re-minting

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Farcaster     │    │   ZK Circuit     │    │   Base Mainnet  │
│   Mini App      │ ──▶│   (Circom)       │ ──▶│   Smart Contract│
│                 │    │                  │    │                 │
│ • Biometric     │    │ • Face Hash      │    │ • PoEP NFT      │
│   Capture       │    │ • Nullifier Gen  │    │ • Trust Scores  │
│ • ZK Proving    │    │ • Groth16 Proof  │    │ • Soul-Bound    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │              ┌──────────────────┐               │
         └──────────────▶│   IPFS Metadata  │◀──────────────┘
                        │                  │
                        │ • Dynamic JSON   │
                        │ • Score-based    │
                        │ • Tier Images    │
                        └──────────────────┘
```

## 📋 Project Structure

```
peop-mini/
├── circuits/                  # ZK-SNARK circuits
│   ├── facehash.circom       # Main Circom circuit
│   ├── compile.sh            # Circuit compilation script
│   └── build/                # Generated circuit files
├── contracts/                # Smart contracts
│   ├── PoEP.sol              # Main NFT contract
│   ├── PoEPVerifier.sol      # ZK proof verifier
│   └── hardhat.config.js     # Deployment config
├── src/
│   ├── components/
│   │   ├── BiometricCapture.tsx    # Camera & face detection
│   │   ├── ZKProofGenerator.tsx    # Proof generation
│   │   └── PassportManager.tsx     # NFT minting UI
│   └── lib/
│       ├── zkProofs.ts       # ZK utilities
│       └── contracts.ts      # Contract interactions
├── indexer/                  # Blockchain monitoring
│   └── score-indexer.js      # Trust score automation
├── ipfs/                     # Metadata management
│   └── metadata-manager.js   # Dynamic NFT metadata
└── public/                   # Static assets
    ├── circuit.wasm          # Circuit WebAssembly
    ├── circuit_final.zkey    # Proving key
    └── verification_key.json # Verification key
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ LTS
- Base wallet with ETH for gas
- Camera-enabled device

### 1. Clone and Install
```bash
git clone https://github.com/vijaygopalbalasa/peop-mini.git
cd peop-mini
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# App Configuration
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NEXT_PUBLIC_POEP_CONTRACT_ADDRESS=0x...

# Base Network
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_key

# IPFS (Optional)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Bot Configuration (for trust score updates)
BOT_PRIVATE_KEY=bot_private_key
```

### 3. Compile ZK Circuits
```bash
cd circuits
chmod +x compile.sh
./compile.sh
```

### 4. Deploy Contracts
```bash
# Deploy to Base Sepolia (testnet)
cd contracts
npx hardhat run scripts/deploy.js --network baseSepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network baseMainnet
```

### 5. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your PoEP app!

## 🔧 Key Components

### **BiometricCapture.tsx**
- WebRTC camera access
- Real-time face detection
- Privacy-preserving feature extraction
- Local Poseidon hashing

### **ZKProofGenerator.tsx**
- SnarkJS integration
- Circuit witness computation
- Groth16 proof generation
- Solidity-compatible formatting

### **Smart Contracts**
- `PoEP.sol`: ERC721 soul-bound NFT with trust scoring
- `PoEPVerifier.sol`: ZK proof verification using Groth16
- Nullifier tracking to prevent double-minting

### **Trust Score Indexer**
- Real-time Base blockchain monitoring
- Automatic score updates for passport holders
- Transaction value and complexity scoring
- Gas-efficient batch updates

## 🎮 Usage

### **For Users**
1. **Visit the Farcaster Mini App**
2. **Take a 2-second selfie** (processed locally)
3. **Generate ZK proof** of your biometric data
4. **Mint your soul-bound PoEP NFT**
5. **Watch your trust score grow** with each Base transaction!

### **For Developers**
```typescript
// Check if user has PoEP passport
const hasPassport = await poepContract.hasMinted(userAddress);

// Get current trust score
const trustScore = await poepContract.viewTrustScore(userAddress);

// Gate features based on score
if (trustScore >= 10) {
  // Unlock premium features
}
```

## 🔐 Security Features

### **ZK-SNARK Privacy**
- Biometric data never leaves the user's device
- Zero-knowledge proofs verify identity without exposure
- Cryptographic nullifiers prevent duplicate accounts

### **Soul-Bound Protection**
- NFTs cannot be transferred after minting
- One passport per wallet address maximum
- Resistant to Sybil attacks

### **Smart Contract Security**
- OpenZeppelin 5.0 contracts
- Reentrancy protection
- Owner-only administrative functions

## 🏆 Base Onchain Summer Integration

PoEP is built specifically for the **Base Onchain Summer Awards**:

### **Awards Categories**
- ✅ **Top 5 New Mini Apps** (launched after July 1, 2025)
- ✅ **Farcaster Mini App** integration
- ✅ **Base mainnet** deployment
- ✅ **Real utility** for the Base ecosystem

### **Evaluation Metrics**
- **Demand for Base blockspace**: ✅ Generates NFT mints + score updates
- **Repeat user interactions**: ✅ Growing trust scores incentivize usage
- **New user onboarding**: ✅ One-click identity verification
- **Transaction volume**: ✅ Encourages Base ecosystem participation

## 📊 Technical Specifications

### **ZK Circuit**
- **Language**: Circom 2.0
- **Proof System**: Groth16
- **Hash Function**: Poseidon (SNARK-friendly)
- **Public Signals**: 1 (nullifier)
- **Constraints**: ~1000 (efficient verification)

### **Smart Contracts**
- **Solidity**: 0.8.20
- **Gas Optimized**: <100k gas per mint
- **Standards**: ERC721, OpenZeppelin 5.0
- **Networks**: Base Mainnet (8453)

### **Performance**
- **Proof Generation**: ~2-5 seconds (browser)
- **Verification**: <50k gas on-chain
- **Metadata Updates**: Real-time via IPFS
- **Trust Score Indexing**: <1 minute delay

## 🛡️ Privacy & Compliance

### **Data Protection**
- **No PII stored**: Only cryptographic hashes
- **Local processing**: Biometrics never transmitted
- **GDPR compliant**: Users control their data
- **Decentralized**: No central authority

### **Transparency**
- **Open source**: MIT license
- **Auditable**: All code public on GitHub
- **Verifiable**: On-chain proof verification

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://peop-mini.vercel.app](https://peop-mini.vercel.app)
- **Farcaster Mini App**: Coming soon to Warpcast
- **Base Contract**: [View on BaseScan](https://basescan.org/address/0x...)
- **Documentation**: [Full technical docs](https://docs.peop.xyz)

## 🙏 Acknowledgments

- **Base Team** for the amazing L2 infrastructure
- **Farcaster** for the mini app framework
- **Circom/SnarkJS** for ZK tooling
- **OpenZeppelin** for secure contract libraries
- **Vercel** for seamless deployment

---

**Built with ❤️ for Base Onchain Summer 2025**

*Bringing the next billion users onchain, one proof at a time.*