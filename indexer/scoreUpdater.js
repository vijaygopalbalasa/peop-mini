#!/usr/bin/env node

/**
 * PoEP Trust Score Updater Bot
 *
 * This bot monitors Base mainnet for transactions and automatically
 * updates trust scores for PoEP passport holders.
 *
 * Score increases:
 * - Any transaction: +1 point
 * - NFT mint: +2 points
 * - DeFi interaction: +3 points
 * - Contract deployment: +5 points
 */

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const BASE_RPC_URL = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POEP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS;
const UPDATE_INTERVAL = parseInt(process.env.INDEXER_UPDATE_INTERVAL) || 60000; // 1 minute
const LOOKBACK_BLOCKS = parseInt(process.env.INDEXER_LOOKBACK_BLOCKS) || 100;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable required');
  process.exit(1);
}

if (!POEP_CONTRACT_ADDRESS) {
  console.error('❌ POEP_CONTRACT_ADDRESS environment variable required');
  process.exit(1);
}

// Smart contract ABI
const POEP_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "hasPassport",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "increment", "type": "uint256"}
    ],
    "name": "addScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "viewTrustScore",
    "outputs": [{"internalType": "uint256", "name": "score", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize clients
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL)
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(BASE_RPC_URL)
});

// State tracking
let lastProcessedBlock = 0n;
let isProcessing = false;

// NFT marketplace contract addresses (common ones on Base)
const NFT_MARKETPLACES = new Set([
  '0x00000000000001ad428e4906ae43d8f9852d0dd6', // OpenSea Seaport
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a', // LooksRare
  '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3', // X2Y2
]);

// DeFi protocol addresses (major ones on Base)
const DEFI_PROTOCOLS = new Set([
  '0x4200000000000000000000000000000000000006', // WETH
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', // DAI
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22', // cbETH
  // Add more Base DeFi protocol addresses
]);

/**
 * Calculate score increase based on transaction type
 */
function calculateScoreIncrease(tx) {
  let baseScore = 1; // Base score for any transaction

  // Check transaction value
  const valueInEth = parseFloat(tx.value) / 1e18;

  // NFT minting/trading (higher score)
  if (NFT_MARKETPLACES.has(tx.to?.toLowerCase()) ||
      tx.input?.includes('mint') ||
      tx.input?.includes('safeTransferFrom')) {
    baseScore += 2;
  }

  // DeFi interactions (higher score)
  if (DEFI_PROTOCOLS.has(tx.to?.toLowerCase()) ||
      tx.input?.includes('swap') ||
      tx.input?.includes('addLiquidity') ||
      tx.input?.includes('stake')) {
    baseScore += 3;
  }

  // Contract deployment (highest score)
  if (!tx.to || tx.to === '0x') {
    baseScore += 5;
  }

  // Bonus for high-value transactions
  if (valueInEth > 0.1) baseScore += 1;
  if (valueInEth > 1.0) baseScore += 2;

  return Math.min(baseScore, 10); // Cap at 10 points per transaction
}

/**
 * Check if address has a PoEP passport
 */
async function hasPassport(address) {
  try {
    const result = await publicClient.readContract({
      address: POEP_CONTRACT_ADDRESS,
      abi: POEP_ABI,
      functionName: 'hasPassport',
      args: [address],
    });
    return result;
  } catch (error) {
    console.error(`Error checking passport for ${address}:`, error.message);
    return false;
  }
}

/**
 * Update trust score for an address
 */
async function updateTrustScore(address, scoreIncrease) {
  try {
    console.log(`📈 Updating score for ${address}: +${scoreIncrease}`);

    const { request } = await publicClient.simulateContract({
      account,
      address: POEP_CONTRACT_ADDRESS,
      abi: POEP_ABI,
      functionName: 'addScore',
      args: [address, scoreIncrease],
    });

    const hash = await walletClient.writeContract(request);

    console.log(`✅ Score updated! Transaction: ${hash}`);
    return hash;
  } catch (error) {
    console.error(`❌ Failed to update score for ${address}:`, error.message);
    return null;
  }
}

/**
 * Process transactions in a block
 */
async function processBlock(blockNumber) {
  try {
    console.log(`🔍 Processing block ${blockNumber}...`);

    const block = await publicClient.getBlock({
      blockNumber,
      includeTransactions: true
    });

    if (!block.transactions || block.transactions.length === 0) {
      return;
    }

    console.log(`📦 Found ${block.transactions.length} transactions in block ${blockNumber}`);

    const scoreUpdates = new Map(); // address -> total score increase

    // Process each transaction
    for (const tx of block.transactions) {
      if (!tx.from) continue;

      // Check if sender has a passport
      const senderHasPassport = await hasPassport(tx.from);
      if (!senderHasPassport) continue;

      // Calculate score increase
      const scoreIncrease = calculateScoreIncrease(tx);

      // Accumulate score increases per address
      const currentIncrease = scoreUpdates.get(tx.from) || 0;
      scoreUpdates.set(tx.from, currentIncrease + scoreIncrease);

      console.log(`💰 Transaction ${tx.hash}: ${tx.from} +${scoreIncrease} points`);
    }

    // Batch update scores
    for (const [address, totalIncrease] of scoreUpdates) {
      await updateTrustScore(address, totalIncrease);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Block ${blockNumber} processed: ${scoreUpdates.size} scores updated`);

  } catch (error) {
    console.error(`❌ Error processing block ${blockNumber}:`, error.message);
  }
}

/**
 * Main indexer loop
 */
async function startIndexer() {
  console.log('🚀 Starting PoEP Trust Score Updater...');
  console.log(`📡 Connected to Base mainnet: ${BASE_RPC_URL}`);
  console.log(`📋 PoEP Contract: ${POEP_CONTRACT_ADDRESS}`);
  console.log(`👤 Updater Account: ${account.address}`);
  console.log(`⏱️  Update Interval: ${UPDATE_INTERVAL}ms`);
  console.log(`📊 Lookback Blocks: ${LOOKBACK_BLOCKS}`);

  // Get starting block
  if (lastProcessedBlock === 0n) {
    const latestBlock = await publicClient.getBlockNumber();
    lastProcessedBlock = latestBlock - BigInt(LOOKBACK_BLOCKS);
    console.log(`🎯 Starting from block ${lastProcessedBlock}`);
  }

  // Main processing loop
  setInterval(async () => {
    if (isProcessing) {
      console.log('⏳ Still processing previous batch...');
      return;
    }

    try {
      isProcessing = true;

      const latestBlock = await publicClient.getBlockNumber();
      const blocksToProcess = latestBlock - lastProcessedBlock;

      if (blocksToProcess === 0n) {
        console.log(`😴 No new blocks to process (current: ${latestBlock})`);
        return;
      }

      console.log(`🔄 Processing ${blocksToProcess} new blocks...`);

      // Process blocks in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < blocksToProcess; i += batchSize) {
        const endBlock = lastProcessedBlock + BigInt(Math.min(batchSize, Number(blocksToProcess - BigInt(i))));

        for (let blockNum = lastProcessedBlock + 1n; blockNum <= endBlock; blockNum++) {
          await processBlock(blockNum);
        }

        lastProcessedBlock = endBlock;

        // Brief pause between batches
        if (i + batchSize < blocksToProcess) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`✅ Caught up to block ${latestBlock}`);

    } catch (error) {
      console.error('❌ Indexer error:', error.message);
    } finally {
      isProcessing = false;
    }
  }, UPDATE_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down PoEP Trust Score Updater...');
    console.log(`📊 Last processed block: ${lastProcessedBlock}`);
    process.exit(0);
  });
}

/**
 * Health check endpoint
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    lastProcessedBlock: lastProcessedBlock.toString(),
    isProcessing,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🔊 Health check server running on port ${PORT}`);
});

// Start the indexer
startIndexer().catch(error => {
  console.error('💥 Fatal error starting indexer:', error);
  process.exit(1);
});