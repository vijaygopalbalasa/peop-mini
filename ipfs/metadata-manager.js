/**
 * PoEP IPFS Metadata Manager
 *
 * Handles dynamic NFT metadata storage and retrieval using IPFS
 * Since nft.storage classic is deprecated, using alternative IPFS solutions
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class PoEPMetadataManager {
  constructor() {
    // IPFS gateway for reading
    this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

    // Alternative IPFS pinning service (e.g., Pinata, Lighthouse)
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;

    // Base metadata template
    this.baseMetadata = {
      name: "PoEP - Proof-of-Existence Passport",
      description: "A soul-bound NFT that proves unique human identity using zero-knowledge proofs. Your onchain reputation grows with every transaction.",
      external_url: "https://peop-mini.vercel.app",
      background_color: "1a1b23",
      attributes: []
    };
  }

  /**
   * Generate dynamic metadata for a PoEP NFT
   */
  generateMetadata(trustScore = 1, userAddress = null) {
    const metadata = {
      ...this.baseMetadata,
      image: this.getImageForScore(trustScore),
      attributes: [
        {
          trait_type: "Trust Score",
          value: trustScore,
          display_type: "number"
        },
        {
          trait_type: "Verification Method",
          value: "ZK-SNARK Biometric"
        },
        {
          trait_type: "Soul Bound",
          value: "Yes"
        },
        {
          trait_type: "Network",
          value: "Base"
        },
        {
          trait_type: "Score Tier",
          value: this.getScoreTier(trustScore)
        },
        {
          trait_type: "Generation",
          value: "Genesis"
        }
      ]
    };

    // Add timestamp
    metadata.attributes.push({
      trait_type: "Last Updated",
      value: Math.floor(Date.now() / 1000),
      display_type: "date"
    });

    // Add score-based properties
    if (trustScore >= 100) {
      metadata.attributes.push({
        trait_type: "Elite Status",
        value: "Gold"
      });
    } else if (trustScore >= 50) {
      metadata.attributes.push({
        trait_type: "Elite Status",
        value: "Silver"
      });
    } else if (trustScore >= 10) {
      metadata.attributes.push({
        trait_type: "Elite Status",
        value: "Bronze"
      });
    }

    return metadata;
  }

  /**
   * Get image URL based on trust score
   */
  getImageForScore(trustScore) {
    // Use different images based on trust score tiers
    if (trustScore >= 100) {
      return `${process.env.NEXT_PUBLIC_URL}/images/poep-gold.png`;
    } else if (trustScore >= 50) {
      return `${process.env.NEXT_PUBLIC_URL}/images/poep-silver.png`;
    } else if (trustScore >= 10) {
      return `${process.env.NEXT_PUBLIC_URL}/images/poep-bronze.png`;
    } else {
      return `${process.env.NEXT_PUBLIC_URL}/images/poep-standard.png`;
    }
  }

  /**
   * Get score tier name
   */
  getScoreTier(trustScore) {
    if (trustScore >= 100) return "Legendary";
    if (trustScore >= 50) return "Elite";
    if (trustScore >= 10) return "Veteran";
    if (trustScore >= 5) return "Active";
    return "Newcomer";
  }

  /**
   * Upload metadata to IPFS using Pinata
   */
  async uploadToPinata(metadata) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `PoEP Metadata - Score ${metadata.attributes.find(a => a.trait_type === 'Trust Score')?.value || 0}`,
            keyvalues: {
              project: 'PoEP',
              type: 'metadata',
              score: metadata.attributes.find(a => a.trait_type === 'Trust Score')?.value?.toString() || '0'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        ipfsHash: result.IpfsHash,
        ipfsUrl: `${this.ipfsGateway}${result.IpfsHash}`,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };

    } catch (error) {
      console.error('Failed to upload to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload to local IPFS node (alternative)
   */
  async uploadToLocalIPFS(metadata) {
    try {
      const response = await fetch('http://localhost:5001/api/v0/add', {
        method: 'POST',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Local IPFS upload failed');
      }

      const result = await response.json();
      return {
        ipfsHash: result.Hash,
        ipfsUrl: `${this.ipfsGateway}${result.Hash}`
      };

    } catch (error) {
      console.error('Failed to upload to local IPFS:', error);
      throw error;
    }
  }

  /**
   * Create a dynamic metadata endpoint that serves JSON based on score
   */
  createDynamicMetadata(trustScore) {
    const metadata = this.generateMetadata(trustScore);

    // For demonstration, we'll create a data URI (in production, this would be uploaded to IPFS)
    const metadataJson = JSON.stringify(metadata, null, 2);
    const dataUri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`;

    return {
      metadata,
      dataUri,
      jsonString: metadataJson
    };
  }

  /**
   * Get metadata URL that includes score parameter
   */
  getMetadataUrl(score = 1) {
    return `${process.env.NEXT_PUBLIC_URL}/api/metadata?score=${score}`;
  }

  /**
   * Upload placeholder assets to IPFS
   */
  async uploadPlaceholderAssets() {
    // This would upload the actual PNG files for different tiers
    // For now, return placeholder URLs

    const assets = {
      standard: `${process.env.NEXT_PUBLIC_URL}/images/poep-standard.png`,
      bronze: `${process.env.NEXT_PUBLIC_URL}/images/poep-bronze.png`,
      silver: `${process.env.NEXT_PUBLIC_URL}/images/poep-silver.png`,
      gold: `${process.env.NEXT_PUBLIC_URL}/images/poep-gold.png`
    };

    console.log('📦 Placeholder assets URLs:', assets);
    return assets;
  }

  /**
   * Create a batch update for multiple users
   */
  async batchUpdateMetadata(userScores) {
    const updates = [];

    for (const [userAddress, trustScore] of Object.entries(userScores)) {
      try {
        const metadata = this.generateMetadata(trustScore, userAddress);
        const result = await this.uploadToPinata(metadata);

        updates.push({
          userAddress,
          trustScore,
          ipfsHash: result.ipfsHash,
          metadataUrl: result.ipfsUrl
        });

      } catch (error) {
        console.error(`Failed to update metadata for ${userAddress}:`, error);
      }
    }

    return updates;
  }
}

// Example usage and testing
async function testMetadataManager() {
  const manager = new PoEPMetadataManager();

  console.log('🧪 Testing PoEP Metadata Manager...');

  // Test metadata generation for different scores
  const scores = [1, 5, 10, 25, 50, 100];

  for (const score of scores) {
    const { metadata, dataUri } = manager.createDynamicMetadata(score);
    console.log(`\n📊 Score ${score} (${manager.getScoreTier(score)}):`);
    console.log('- Name:', metadata.name);
    console.log('- Image:', metadata.image);
    console.log('- Attributes:', metadata.attributes.length);
    console.log('- Data URI length:', dataUri.length);
  }

  // Test dynamic URL generation
  console.log('\n🔗 Dynamic metadata URLs:');
  scores.forEach(score => {
    console.log(`Score ${score}: ${manager.getMetadataUrl(score)}`);
  });

  console.log('\n✅ Metadata manager test complete!');
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMetadataManager().catch(console.error);
}

export default PoEPMetadataManager;