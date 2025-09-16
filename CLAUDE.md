# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Proof-of-Existence Passport (PoEP) project - a decentralized digital identity system built on Base blockchain. It provides soul-bound NFTs that serve as onchain passports with dynamic trust scores based on user activity. The project includes multiple applications and uses Zero-Knowledge proofs for privacy-preserving identity verification.

## Project Structure

The repository contains several key components:

- **`contracts/`** - Smart contracts (PoEP.sol, PoEPVerifier.sol) built with Hardhat
- **`circuits/`** - Circom ZK circuits for identity verification
- **`zk/`** - ZK proof setup and compilation utilities
- **`peop-mini/`** - Main Next.js miniapp with Farcaster integration
- **`onchain-poep-app/`** - Web interface for minting passports and checking trust scores
- **`farcaster-frame/`** - Farcaster frame application
- **`indexer/`** - Backend indexing service

## Common Commands

### Initial Setup
```bash
npm run setup                    # Setup all components (ZK, contracts, app)
npm run setup:zk                 # Setup ZK circuits only
npm run setup:contracts          # Setup and compile contracts only
npm run setup:app               # Setup frontend app only
```

### Development
```bash
npm run dev                      # Start main app development server
cd onchain-poep-app && npm run dev  # Start onchain app at localhost:3000
cd farcaster-frame && npm run dev   # Start Farcaster frame at localhost:5173
cd peop-mini && npm run dev      # Start miniapp with hot reload
```

### Building and Deployment
```bash
npm run build                    # Build main application
npm run test                     # Run contract tests
npm run deploy:sepolia           # Deploy contracts to Base Sepolia
npm run deploy:mainnet           # Deploy contracts to Base Mainnet
```

### ZK Circuit Operations
```bash
cd circuits && ./compile.sh     # Compile Circom circuits and generate verifier
cd zk && ./setup.sh             # Full ZK setup including ceremony
```

### peop-mini Specific Commands
```bash
cd peop-mini
npm run lint                     # ESLint checking
npm run deploy:vercel           # Deploy to Vercel with custom script
npm run deploy:raw              # Direct Vercel deployment
npm run cleanup                 # Clean up deployment artifacts
```

## Architecture Notes

### Smart Contract Architecture
- **PoEP.sol** - Main NFT contract with soul-bound tokens and trust scoring
- **PoEPVerifier.sol** - Auto-generated ZK proof verifier from Circom circuits
- Uses OpenZeppelin standards with custom modifications for soul-bound behavior

### ZK Circuit System
- **facehash.circom** - Main identity verification circuit
- Compilation pipeline: Circom → R1CS → WASM + zkey → Solidity verifier
- Powers of Tau ceremony simulation for trusted setup
- Files generated: circuit.wasm, circuit_final.zkey, verification_key.json

### Frontend Architecture
- Multiple Next.js applications with shared OnchainKit integration
- Wagmi + Viem for Ethereum interactions
- Farcaster SDK integration for miniapp functionality
- TailwindCSS + Radix UI components
- React Query for state management

### Network Configuration
- **Base Sepolia** (testnet): Chain ID 84532
- **Base Mainnet**: Chain ID 8453
- Hardhat local development: Chain ID 31337
- Environment variables in `.env` files control network selection

## Development Workflow

1. **Environment Setup**: Copy `.env.example` to `.env` and configure RPC URLs, private keys
2. **ZK Setup**: Run ZK circuit compilation before contract deployment
3. **Contract Development**: Use Hardhat for compilation, testing, deployment
4. **Frontend Development**: Each app has independent dev servers and build processes
5. **Testing**: Contracts use Hardhat test framework, frontend apps use Vitest

## Key Dependencies

- **Hardhat** - Smart contract development framework
- **Circom/SnarkJS** - ZK proof system
- **OnchainKit** - Coinbase's React components for onchain apps
- **Wagmi/Viem** - Ethereum React hooks and utilities
- **Farcaster SDK** - Integration with Farcaster protocol
- **Next.js 15** - React framework (note: using React 19 in peop-mini)