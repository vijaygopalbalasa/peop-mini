#!/usr/bin/env node

/**
 * Direct Base Mainnet Deployment Script
 * Deploys PoEP contracts directly to Base mainnet
 */

import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Base Mainnet configuration
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable required');
  process.exit(1);
}

async function deployToMainnet() {
  console.log('🚀 Deploying PoEP to Base Mainnet...');

  // Connect to Base mainnet
  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📝 Deployer address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther('0.001')) {
    console.error('❌ Insufficient balance for deployment');
    process.exit(1);
  }

  // Check network
  const network = await provider.getNetwork();
  console.log(`🌐 Connected to chain ID: ${network.chainId}`);

  if (network.chainId !== 8453n) {
    console.error('❌ Not connected to Base mainnet (chain ID 8453)');
    process.exit(1);
  }

  try {
    // Read compiled contract artifacts
    const verifierArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PoEPVerifier.sol/PoEPVerifier.json', 'utf8'));
    const poepArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PoEP.sol/PoEP.json', 'utf8'));

    // Deploy PoEPVerifier
    console.log('📄 Deploying PoEPVerifier...');
    const VerifierFactory = new ethers.ContractFactory(verifierArtifact.abi, verifierArtifact.bytecode, wallet);
    const verifier = await VerifierFactory.deploy({
      gasLimit: 6000000,
      gasPrice: ethers.parseUnits('0.01', 'gwei') // Very low gas price for Base
    });

    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`✅ PoEPVerifier deployed at: ${verifierAddress}`);

    // Deploy PoEP main contract
    console.log('📄 Deploying PoEP main contract...');
    const baseURI = `${process.env.NEXT_PUBLIC_URL}/api/metadata`;

    const PoEPFactory = new ethers.ContractFactory(poepArtifact.abi, poepArtifact.bytecode, wallet);
    const poep = await PoEPFactory.deploy(verifierAddress, baseURI, {
      gasLimit: 4000000,
      gasPrice: ethers.parseUnits('0.01', 'gwei')
    });

    await poep.waitForDeployment();
    const poepAddress = await poep.getAddress();
    console.log(`✅ PoEP deployed at: ${poepAddress}`);

    // Save deployment info
    const deploymentData = {
      network: 'Base Mainnet',
      chainId: 8453,
      timestamp: new Date().toISOString(),
      contracts: {
        verifier: {
          address: verifierAddress,
          contractName: 'PoEPVerifier'
        },
        poep: {
          address: poepAddress,
          contractName: 'PoEP',
          constructorArgs: [verifierAddress, baseURI]
        }
      },
      explorerUrls: {
        verifier: `https://basescan.org/address/${verifierAddress}`,
        poep: `https://basescan.org/address/${poepAddress}`
      }
    };

    // Create deployments directory
    if (!fs.existsSync('./deployments')) {
      fs.mkdirSync('./deployments', { recursive: true });
    }

    fs.writeFileSync('./deployments/base-mainnet.json', JSON.stringify(deploymentData, null, 2));

    console.log('\n🎉 BASE MAINNET DEPLOYMENT SUCCESSFUL!');
    console.log('========================================');
    console.log(`Network: Base Mainnet (Chain ID: 8453)`);
    console.log(`\n📋 Contract Addresses:`);
    console.log(`PoEPVerifier: ${verifierAddress}`);
    console.log(`PoEP:         ${poepAddress}`);
    console.log(`\n🔍 Explorer Links:`);
    console.log(`PoEPVerifier: https://basescan.org/address/${verifierAddress}`);
    console.log(`PoEP:         https://basescan.org/address/${poepAddress}`);
    console.log(`\n📝 Update your .env file with these addresses:`);
    console.log(`NEXT_PUBLIC_POEP_CONTRACT_ADDRESS="${poepAddress}"`);
    console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS="${verifierAddress}"`);

    return { verifierAddress, poepAddress };

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToMainnet().then(() => {
  console.log('\n✨ Ready for production! 🚀');
  process.exit(0);
}).catch(console.error);