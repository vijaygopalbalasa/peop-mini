# PoEP - Proof-of-Existence Passport

**Your onchain identity, secured by Zero-Knowledge proofs**

PoEP (Proof-of-Existence Passport) is a privacy-first digital identity system that creates unique, soul-bound NFT passports on Base blockchain using biometric verification and Zero-Knowledge proofs. Each passport is tied to a unique individual through privacy-preserving cryptographic proofs, preventing duplicate accounts while maintaining complete anonymity.

## 🌟 Features

- **🔐 Privacy-First**: Biometric data never leaves your device
- **🧮 Zero-Knowledge Proofs**: Prove uniqueness without revealing identity
- **🛡️ Soul-bound NFTs**: Non-transferable identity tokens on Base
- **📈 Dynamic Trust Scores**: Reputation system based on on-chain activity
- **📱 Farcaster Integration**: Mini app for seamless social verification
- **⚡ Base Optimized**: Low-cost transactions on Base L2
- **🔒 Anti-Sybil**: Cryptographically prevents multiple accounts per person

## 🏗️ Architecture

This project consists of several interconnected components:

### Core Components

```
poep/
├── peop-mini/                    # Next.js Farcaster Mini App
│   ├── src/
│   │   ├── app/                  # Next.js 15 App Router
│   │   │   ├── api/             # API endpoints for minting, validation
│   │   │   └── page.tsx         # Main app entry point
│   │   ├── components/          # React components
│   │   │   ├── ui/              # UI components and tabs
│   │   │   ├── App.tsx          # Main app orchestrator
│   │   │   └── WalletConnector.tsx
│   │   ├── lib/                 # Core libraries
│   │   │   ├── zkProof.ts       # ZK proof generation
│   │   │   ├── contract.ts      # Smart contract interactions
│   │   │   └── constants.ts     # Configuration constants
│   │   └── hooks/               # Custom React hooks
│   ├── contracts/               # Solidity smart contracts
│   │   ├── PoEP.sol            # Main passport NFT contract
│   │   └── PoEPVerifier.sol    # ZK proof verifier contract
│   ├── circuits/               # Circom ZK circuits
│   │   ├── facehash.circom     # Face hash verification circuit
│   │   └── circomlib/          # Circom standard library
│   └── public/                 # Static assets
└── package.json               # Root package configuration
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Solidity 0.8.20, Hardhat, Base L2
- **Zero-Knowledge**: Circom, snarkjs, Poseidon hash
- **Identity**: Farcaster Mini App SDK, OnchainKit
- **Storage**: Upstash Redis, IPFS via Pinata
- **Deployment**: Vercel, Base Mainnet

## 🔬 How It Works

### 1. Biometric Capture & Processing
```typescript
// User takes a selfie using device camera
const imageData = capturePhoto(); // Never uploaded

// Extract facial features locally
const faceHash = await generateFaceHash(imageData);
```

### 2. Zero-Knowledge Proof Generation
```circom
// facehash.circom - Privacy-preserving uniqueness proof
template FaceHashVerifier() {
    signal input faceHash;      // Private: biometric hash
    signal input nonce;         // Private: randomness
    signal input timestamp;     // Private: temporal uniqueness

    signal output nullifier;    // Public: unique identifier

    // Generate nullifier without revealing inputs
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== faceHash;
    poseidon.inputs[1] <== nonce;
    poseidon.inputs[2] <== timestamp;

    nullifier <== poseidon.out;
}
```

### 3. Soul-bound NFT Minting
```solidity
// PoEP.sol - Prevents duplicate minting with nullifiers
function mint(
    uint[2] calldata _pA,
    uint[2][2] calldata _pB,
    uint[2] calldata _pC,
    uint256 _nullifier
) external {
    require(!nullifiers[_nullifier], "Already used");
    require(zkVerifier.verifyProof(_pA, _pB, _pC, [_nullifier]), "Invalid proof");

    _mint(msg.sender, tokenId);
    nullifiers[_nullifier] = true;
    trustScore[tokenId] = 1; // Genesis score
}
```

### 4. Trust Score Evolution
```solidity
// Dynamic reputation based on on-chain activity
function updateScore(address user, int256 delta) external {
    require(scoreUpdaters[msg.sender], "Not authorized");
    uint256 newScore = calculateNewScore(trustScore[tokenId], delta);
    trustScore[tokenId] = newScore;
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn or npm
- Git
- A Base wallet with ETH for gas

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poep
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install app dependencies
   cd peop-mini
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Copy app environment template
   cd peop-mini
   cp .env .env.local
   ```

4. **Configure Environment Variables**

   **Required for local development:**
   ```bash
   # In peop-mini/.env.local
   NEYNAR_API_KEY="your_neynar_api_key"
   KV_REST_API_TOKEN="your_upstash_token"
   KV_REST_API_URL="your_upstash_url"
   PRIVATE_KEY="your_wallet_private_key"
   ```

5. **Set up ZK Circuits**
   ```bash
   cd circuits
   chmod +x compile.sh
   ./compile.sh
   ```

6. **Deploy Contracts (Optional)**
   ```bash
   # Deploy to Base Sepolia testnet
   npx hardhat run scripts/deploy.js --network baseSepolia
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the app.

## 📱 Farcaster Mini App

PoEP is designed as a Farcaster Mini App that integrates seamlessly into the Farcaster ecosystem:

### Mini App Features
- **One-click launch** from Farcaster frames
- **Wallet connection** via Farcaster account
- **Social verification** through Farcaster identity
- **Seamless UX** with MiniKit SDK integration

### Mini App Configuration
```typescript
// Farcaster Mini App metadata
const miniappEmbed = {
  "version": "1",
  "name": "PoEP - Proof-of-Existence Passport",
  "homeUrl": "https://peop-mini.vercel.app",
  "requiredCapabilities": ["camera", "clipboard-write"],
  "requiredChains": ["eip155:8453"]
};
```

## 🔐 Security Features

### Privacy Protection
- **Local Processing**: Biometric data never leaves the device
- **Zero-Knowledge Proofs**: Prove uniqueness without revealing identity
- **Nullifier System**: Prevents double-spending without linking identities
- **Secure Rate Limiting**: API protection against abuse

### Anti-Sybil Mechanisms
- **Biometric Uniqueness**: One passport per unique individual
- **Cryptographic Nullifiers**: Prevent duplicate accounts
- **Soul-bound Design**: Non-transferable identity tokens

### Smart Contract Security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Access Control**: Role-based permissions for score updates
- **Input Validation**: Comprehensive parameter checking

## 📊 API Reference

### Core Endpoints

#### POST `/api/mint-poep`
Creates a new PoEP passport with ZK proof verification.

**Request:**
```typescript
{
  "proof": {
    "pA": [string, string],
    "pB": [[string, string], [string, string]],
    "pC": [string, string]
  },
  "nullifier": string,
  "userAddress": string
}
```

**Response:**
```typescript
{
  "success": boolean,
  "transactionHash": string,
  "trustScore": string,
  "blockNumber": number
}
```

#### GET `/api/check-poep?address={address}`
Checks if an address has an existing PoEP passport.

**Response:**
```typescript
{
  "hasPoEP": boolean,
  "trustScore": number,
  "tokenId": string
}
```

#### GET `/api/health`
Health check endpoint for monitoring.

## 🔧 Smart Contracts

### PoEP Contract (0x2959E7CE18CA72CF65fB010f0aF892B8B59F7CEB)
Main passport NFT contract implementing ERC721 with soul-bound mechanics.

**Key Functions:**
- `mint()`: Create new passport with ZK proof
- `getTrustScore()`: Query user trust score
- `updateScore()`: Update reputation (authorized only)

### PoEPVerifier Contract (0x3902514624442c302571cA8B60ecba1B66eBF13A)
Groth16 ZK proof verification for biometric uniqueness.

**Key Functions:**
- `verifyProof()`: Validate ZK proof of biometric uniqueness

## 🧪 Testing

### Unit Tests
```bash
cd peop-mini
npx hardhat test
```

### Integration Tests
```bash
npm run test:integration
```

### ZK Circuit Tests
```bash
cd circuits
npm test
```

## 📈 Trust Score System

The trust score is a dynamic reputation system that grows with on-chain activity:

### Score Mechanics
- **Genesis Score**: 1 (upon minting)
- **Maximum Score**: 1000
- **Score Updates**: Based on verified on-chain activities
- **Score Decay**: Prevents score farming (planned feature)

### Score Factors (Future Updates)
- DeFi transactions and liquidity provision
- NFT minting and trading activity
- Community governance participation
- Cross-protocol interactions

## 🌐 Deployment

### Production Deployment (Vercel)

1. **Deploy to Vercel**
   ```bash
   cd peop-mini
   vercel --prod
   ```

2. **Configure Environment Variables**
   Set all required environment variables in Vercel dashboard:
   - `NEYNAR_API_KEY`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_URL`
   - `PRIVATE_KEY`
   - `BASESCAN_API_KEY`

3. **Domain Configuration**
   - Update `NEXT_PUBLIC_URL` to your domain
   - Configure custom domain in Vercel

### Contract Deployment

```bash
# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network baseMainnet

# Verify contracts
npx hardhat verify --network baseMainnet CONTRACT_ADDRESS
```

## 🤝 Contributing

We welcome contributions to improve PoEP! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with comprehensive tests
4. **Run the test suite**: `npm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow security best practices

## 🔮 Roadmap

### Phase 1: Core Infrastructure ✅
- [x] ZK circuit implementation
- [x] Smart contract deployment
- [x] Farcaster Mini App
- [x] Basic trust scoring

### Phase 2: Enhanced Features 🚧
- [ ] Automated trust score indexer
- [ ] Advanced reputation algorithms
- [ ] Multi-chain support
- [ ] Mobile app optimization

### Phase 3: Ecosystem Integration 📋
- [ ] DeFi protocol integrations
- [ ] Cross-platform verification
- [ ] Developer SDK
- [ ] Enterprise API

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

- **Never commit private keys** to version control
- **Always verify contract addresses** before transactions
- **Use secure environment variables** in production
- **Report security issues** responsibly via private channels

## 🆘 Support

### Documentation
- [ZK Circuits Guide](circuits/README.md)
- [Smart Contract Documentation](contracts/README.md)
- [API Documentation](api/README.md)

### Community
- Discord: [Coming Soon]
- Twitter: [@PoEPProtocol](https://twitter.com/PoEPProtocol)
- Email: support@poep.xyz

### Troubleshooting

**Common Issues:**
- **Camera not working**: Check browser permissions and HTTPS
- **Transaction failing**: Verify network (Base) and gas fees
- **ZK proof generation slow**: Normal, takes 10-30 seconds
- **Wallet connection issues**: Try refreshing and reconnecting

---

**Built with ❤️ for a privacy-first, decentralized identity future on Base**