/**
 * PoEP Trust Score Indexer
 *
 * Monitors Base blockchain for user transactions and automatically
 * updates trust scores for PoEP passport holders
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class PoEPTrustScoreIndexer {
  constructor() {
    // Base mainnet RPC
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org'
    );

    // PoEP contract configuration
    this.poepContractAddress = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS;
    this.poepContractABI = [
      "function addScore(address user, uint256 increment) external",
      "function viewTrustScore(address user) external view returns (uint256)",
      "function hasMinted(address user) external view returns (bool)",
      "event PassportMinted(address indexed user, uint256 indexed tokenId, uint256 nullifier)",
      "event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore)"
    ];

    // Bot wallet for updating scores
    if (process.env.BOT_PRIVATE_KEY) {
      this.botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, this.provider);
      this.poepContract = new ethers.Contract(
        this.poepContractAddress,
        this.poepContractABI,
        this.botWallet
      );
    } else {
      console.warn('BOT_PRIVATE_KEY not configured - running in read-only mode');
      this.poepContract = new ethers.Contract(
        this.poepContractAddress,
        this.poepContractABI,
        this.provider
      );
    }

    // Track processed blocks to avoid duplicates
    this.lastProcessedBlock = 0;
    this.processedTransactions = new Set();

    // Passport holders cache
    this.passportHolders = new Set();
  }

  /**
   * Initialize the indexer
   */
  async initialize() {
    console.log('🚀 Initializing PoEP Trust Score Indexer...');

    try {
      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      this.lastProcessedBlock = currentBlock - 100; // Start from 100 blocks ago

      console.log(`📊 Starting from block ${this.lastProcessedBlock}`);
      console.log(`🏠 PoEP Contract: ${this.poepContractAddress}`);

      // Load existing passport holders
      await this.loadPassportHolders();

      console.log(`👥 Found ${this.passportHolders.size} passport holders`);
      console.log('✅ Indexer initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize indexer:', error);
      throw error;
    }
  }

  /**
   * Load existing passport holders from contract events
   */
  async loadPassportHolders() {
    try {
      // Query PassportMinted events from the last 10000 blocks
      const fromBlock = Math.max(0, this.lastProcessedBlock - 10000);

      const filter = this.poepContract.filters.PassportMinted();
      const events = await this.poepContract.queryFilter(filter, fromBlock);

      for (const event of events) {
        const userAddress = event.args.user;
        this.passportHolders.add(userAddress.toLowerCase());
      }

      console.log(`📋 Loaded ${this.passportHolders.size} passport holders from events`);

    } catch (error) {
      console.error('⚠️ Failed to load passport holders:', error);
    }
  }

  /**
   * Start monitoring blockchain for transactions
   */
  async start() {
    console.log('🔍 Starting blockchain monitoring...');

    // Listen for new blocks
    this.provider.on('block', async (blockNumber) => {
      try {
        await this.processBlock(blockNumber);
      } catch (error) {
        console.error(`❌ Error processing block ${blockNumber}:`, error);
      }
    });

    // Listen for new passport mints
    this.poepContract.on('PassportMinted', (user, tokenId, nullifier, event) => {
      console.log(`🆕 New passport minted: ${user}`);
      this.passportHolders.add(user.toLowerCase());
    });

    console.log('👂 Listening for new blocks and passport mints...');
  }

  /**
   * Process a specific block for transactions
   */
  async processBlock(blockNumber) {
    if (blockNumber <= this.lastProcessedBlock) {
      return; // Already processed
    }

    console.log(`🔄 Processing block ${blockNumber}...`);

    try {
      const block = await this.provider.getBlock(blockNumber, true);

      if (!block || !block.transactions) {
        console.log(`⚠️ Block ${blockNumber} has no transactions`);
        return;
      }

      let scoreUpdates = 0;

      // Process each transaction in the block
      for (const tx of block.transactions) {
        if (this.processedTransactions.has(tx.hash)) {
          continue; // Already processed
        }

        await this.processTransaction(tx);
        this.processedTransactions.add(tx.hash);

        // Clean up old transaction hashes (keep last 1000)
        if (this.processedTransactions.size > 1000) {
          const oldestHashes = Array.from(this.processedTransactions).slice(0, 100);
          oldestHashes.forEach(hash => this.processedTransactions.delete(hash));
        }
      }

      this.lastProcessedBlock = blockNumber;

      if (scoreUpdates > 0) {
        console.log(`📈 Updated scores for ${scoreUpdates} transactions in block ${blockNumber}`);
      }

    } catch (error) {
      console.error(`❌ Failed to process block ${blockNumber}:`, error);
    }
  }

  /**
   * Process a transaction and update scores for passport holders
   */
  async processTransaction(tx) {
    try {
      // Skip if no from address
      if (!tx.from) return;

      const fromAddress = tx.from.toLowerCase();

      // Only update scores for passport holders
      if (!this.passportHolders.has(fromAddress)) {
        return;
      }

      // Skip if transaction failed (need receipt to check)
      const receipt = await this.provider.getTransactionReceipt(tx.hash);
      if (!receipt || receipt.status !== 1) {
        return; // Failed transaction
      }

      // Calculate score increment based on transaction type
      const scoreIncrement = this.calculateScoreIncrement(tx, receipt);

      if (scoreIncrement > 0) {
        await this.updateUserScore(fromAddress, scoreIncrement, tx.hash);
      }

    } catch (error) {
      console.error(`⚠️ Failed to process transaction ${tx.hash}:`, error);
    }
  }

  /**
   * Calculate score increment based on transaction characteristics
   */
  calculateScoreIncrement(tx, receipt) {
    let score = 1; // Base score for any transaction

    // Bonus for higher gas usage (more complex transactions)
    const gasUsed = Number(receipt.gasUsed);
    if (gasUsed > 100000) score += 1;
    if (gasUsed > 500000) score += 2;

    // Bonus for higher value transactions
    const value = Number(tx.value);
    if (value > ethers.parseEther('0.01')) score += 1;
    if (value > ethers.parseEther('0.1')) score += 2;

    // Bonus for contract interactions
    if (tx.to && tx.data && tx.data !== '0x') {
      score += 1;
    }

    return Math.min(score, 5); // Cap at 5 points per transaction
  }

  /**
   * Update user's trust score on-chain
   */
  async updateUserScore(userAddress, increment, txHash) {
    if (!this.botWallet) {
      console.log(`📊 Would update score for ${userAddress} (+${increment}) - tx: ${txHash}`);
      return;
    }

    try {
      console.log(`📈 Updating score for ${userAddress} (+${increment})`);

      const tx = await this.poepContract.addScore(userAddress, increment, {
        gasLimit: 100000,
        maxFeePerGas: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei')
      });

      await tx.wait();
      console.log(`✅ Score updated for ${userAddress} - tx: ${tx.hash}`);

    } catch (error) {
      console.error(`❌ Failed to update score for ${userAddress}:`, error);
    }
  }

  /**
   * Get current statistics
   */
  async getStats() {
    return {
      lastProcessedBlock: this.lastProcessedBlock,
      passportHolders: this.passportHolders.size,
      processedTransactions: this.processedTransactions.size
    };
  }

  /**
   * Stop the indexer
   */
  stop() {
    console.log('🛑 Stopping indexer...');
    this.provider.removeAllListeners();
  }
}

// Main execution
async function main() {
  const indexer = new PoEPTrustScoreIndexer();

  try {
    await indexer.initialize();
    await indexer.start();

    // Log stats every 5 minutes
    setInterval(async () => {
      const stats = await indexer.getStats();
      console.log('📊 Indexer Stats:', stats);
    }, 5 * 60 * 1000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down indexer...');
      indexer.stop();
      process.exit(0);
    });

    console.log('🎯 PoEP Trust Score Indexer is running!');

  } catch (error) {
    console.error('💥 Indexer failed to start:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default PoEPTrustScoreIndexer;