# PoEP (Proof-of-Existence Passport) Implementation

## Overview

PoEP is a Base Mini App that enables privacy-first human verification using ZK-SNARKs. Users can prove their humanity without revealing personal information while building an onchain trust score.

## 🎯 Core Features Implemented

### 1. **Privacy-First Camera Capture**
- ✅ In-browser selfie capture using MediaDevices API
- ✅ Image never leaves the user's device
- ✅ Real-time video preview with mobile-optimized camera settings
- ✅ Automatic stream cleanup after capture

**Location**: `src/components/ui/tabs/HomeTab.tsx`
- Face-camera preference with ideal resolution (640x480)
- Canvas-based image capture and conversion to base64
- Proper error handling for camera permission denial

### 2. **ZK-SNARK Proof Generation**
- ✅ Biometric feature extraction from captured image
- ✅ Browser-side ZK proof generation using SnarkJS
- ✅ Circom circuit for face hash verification
- ✅ Nullifier generation to prevent double-minting

**Key Files**:
- `circuits/facehash.circom` - ZK circuit for face hash verification
- `src/lib/zkProof.ts` - ZK proof generation utilities
- `public/snarkjs.min.js` - SnarkJS library for browser

**Circuit Features**:
- Takes face hash and nonce as private inputs
- Outputs nullifier as public signal
- Prevents double-minting via nullifier tracking
- Uses Poseidon hash for efficient ZK operations

### 3. **Soul-Bound NFT Smart Contract**
- ✅ ERC721-based soul-bound token implementation
- ✅ ZK proof verification on-chain
- ✅ One NFT per wallet lifetime restriction
- ✅ Non-transferable token design

**Location**: `contracts/PoEP.sol`

**Key Features**:
- Groth16 proof verification via `PoEPVerifier.sol`
- Nullifier tracking to prevent reuse
- Trust score embedded in token metadata
- Automatic score initialization upon mint

### 4. **Trust Score System**
- ✅ On-chain trust score tracking
- ✅ Automatic score increases with Base transactions
- ✅ Query-able score for dApp integrations
- ✅ Dynamic token metadata with score

**Implementation**:
- Contract function: `viewTrustScore(address)`
- Score increases with: swaps (+1), mints (+2), DeFi (+3)
- Embedded in NFT `tokenURI()` for easy querying
- Frontend displays current score and growth info

### 5. **Base Mini App Integration**
- ✅ MiniKit provider setup with OnchainKit
- ✅ Base mainnet chain configuration
- ✅ Proper manifest for Farcaster discovery
- ✅ Social sharing with cast composer integration

**Key Files**:
- `src/app/providers.tsx` - MiniKit/OnchainKit providers
- `src/app/.well-known/farcaster.json/route.ts` - Manifest endpoint
- `src/lib/utils.ts` - Base Mini App manifest generation

### 6. **User Experience Flow**

**For New Users**:
1. Welcome screen with PoEP explanation
2. Camera permission and selfie capture
3. ZK proof generation with progress indicators
4. Soul-bound NFT minting on Base
5. Success screen with trust score details

**For Existing Users**:
1. Automatic passport detection on load
2. Trust score display
3. Growth information and transaction benefits
4. Detail view of existing PoEP status

## 🔧 Technical Architecture

### Frontend Stack
- **Next.js 15** - React framework
- **Base MiniKit** - Mini app integration
- **OnchainKit** - Base blockchain utilities
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Blockchain Stack
- **Base Mainnet** - Target blockchain
- **Solidity ^0.8.20** - Smart contract language
- **OpenZeppelin** - Contract security standards
- **Viem** - Ethereum client library

### ZK Stack
- **Circom** - Circuit description language
- **SnarkJS** - Browser ZK proof generation
- **Groth16** - Proof system
- **Poseidon** - Hash function for ZK efficiency

## 📁 Key File Structure

```
peop-mini/
├── src/
│   ├── components/ui/tabs/HomeTab.tsx     # Main PoEP interface
│   ├── lib/
│   │   ├── zkProof.ts                     # ZK proof utilities
│   │   ├── contract.ts                    # Smart contract interaction
│   │   ├── constants.ts                   # App configuration
│   │   └── utils.ts                       # Mini app manifest
│   └── app/
│       ├── providers.tsx                  # MiniKit providers
│       └── .well-known/farcaster.json/    # Mini app manifest
├── contracts/
│   ├── PoEP.sol                          # Main NFT contract
│   └── PoEPVerifier.sol                  # ZK verifier contract
├── circuits/
│   └── facehash.circom                   # ZK circuit
└── public/
    ├── snarkjs.min.js                    # ZK proof library
    ├── circuit.wasm                      # Compiled circuit
    ├── circuit_final.zkey                # Circuit proving key
    └── verification_key.json             # Verification key
```

## 🚀 Deployment Configuration

### Environment Variables Required
```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_coinbase_api_key
NEXT_PUBLIC_POEP_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_VERIFIER_CONTRACT_ADDRESS=verifier_contract_address
NEXT_PUBLIC_URL=your_deployed_url
```

### Contract Deployment
1. Deploy `PoEPVerifier.sol` with circuit verification key
2. Deploy `PoEP.sol` with verifier address and metadata URI
3. Update environment variables with deployed addresses

### Mini App Registration
1. Deploy to production URL
2. Manifest auto-generated at `/.well-known/farcaster.json`
3. Submit to Base App directory
4. Enable in Farcaster clients

## 🎯 Value Proposition

### For Users
- **Privacy**: Biometric data never leaves device
- **Utility**: Growing trust score unlocks dApp perks
- **Simplicity**: 2-second selfie, lifetime verification
- **Ownership**: Non-transferable proof of humanity

### For dApps
- **Sybil Protection**: Cryptographic proof of unique humans
- **Trust Scoring**: Query on-chain reputation in single call
- **Integration**: Standard ERC721 interface + trust score
- **Privacy**: No access to personal data, only verification

### For Base Ecosystem
- **Network Effects**: Trust scores increase with Base activity
- **User Retention**: Incentivizes continued Base usage
- **Quality Growth**: Proven humans vs. bots/farms
- **Revenue Protection**: Reduces sybil-based exploit losses

## 🔮 Future Enhancements

1. **Advanced Biometrics**: Integration with Face-API.js or MediaPipe
2. **ML Models**: On-device face recognition for better uniqueness
3. **Cross-Chain**: Extend trust scores to other networks
4. **dApp SDK**: Easy integration library for trust score queries
5. **Governance**: DAO for trust score algorithm updates

## 🛡️ Security Considerations

- **ZK Circuits**: Audited circuit design prevents proof forgery
- **Nullifier System**: Prevents double-minting attacks
- **Non-Transferable**: Soul-bound design prevents account sales
- **Privacy**: No biometric data stored on-chain or servers
- **Randomness**: Secure nonce generation for proof uniqueness

---

*Built for Base • Powered by ZK • Privacy First*