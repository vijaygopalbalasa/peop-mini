#!/usr/bin/env node

/**
 * PoEP Contract Deployment Script
 *
 * Deploys PoEPVerifier and PoEP contracts to Base networks
 * Supports both Base Sepolia (testnet) and Base Mainnet
 */

import hre from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { ethers } = hre;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NETWORKS = {
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org'
  },
  baseMainnet: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org'
  }
};

class ContractDeployer {
  constructor(network) {
    this.network = NETWORKS[network];
    this.deployments = {};

    if (!this.network) {
      throw new Error(`Unknown network: ${network}`);
    }

    console.log(`🚀 Deploying to ${this.network.name} (Chain ID: ${this.network.chainId})`);
  }

  async deploy() {
    try {
      // Get network info
      const [deployer] = await ethers.getSigners();
      console.log(`📝 Deployer address: ${deployer.address}`);

      const balance = await deployer.provider.getBalance(deployer.address);
      console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

      if (balance === 0n) {
        throw new Error('Deployer has no ETH balance. Please fund the account.');
      }

      // Step 1: Deploy PoEPVerifier
      console.log('\n📄 Deploying PoEPVerifier contract...');
      const PoEPVerifier = await ethers.getContractFactory('PoEPVerifier');
      const verifier = await PoEPVerifier.deploy();
      await verifier.waitForDeployment();

      const verifierAddress = await verifier.getAddress();
      console.log(`✅ PoEPVerifier deployed at: ${verifierAddress}`);

      this.deployments.verifier = {
        address: verifierAddress,
        contractName: 'PoEPVerifier'
      };

      // Step 2: Deploy PoEP main contract
      console.log('\n📄 Deploying PoEP main contract...');

      // Base URI for dynamic metadata
      const baseURI = `${process.env.NEXT_PUBLIC_URL}/api/metadata`;

      const PoEP = await ethers.getContractFactory('PoEP');
      const poep = await PoEP.deploy(verifierAddress, baseURI);
      await poep.waitForDeployment();

      const poepAddress = await poep.getAddress();
      console.log(`✅ PoEP deployed at: ${poepAddress}`);

      this.deployments.poep = {
        address: poepAddress,
        contractName: 'PoEP',
        constructorArgs: [verifierAddress, baseURI]
      };

      // Step 3: Save deployment info
      this.saveDeployments();

      // Step 4: Display summary
      this.displaySummary();

      return this.deployments;

    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      throw error;
    }
  }

  saveDeployments() {
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    const networkFile = path.join(deploymentsDir, `${this.network.name.toLowerCase().replace(' ', '-')}.json`);

    // Create deployments directory if it doesn't exist
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentData = {
      network: this.network.name,
      chainId: this.network.chainId,
      timestamp: new Date().toISOString(),
      contracts: this.deployments,
      explorerUrls: {
        verifier: `${this.network.explorerUrl}/address/${this.deployments.verifier.address}`,
        poep: `${this.network.explorerUrl}/address/${this.deployments.poep.address}`
      }
    };

    fs.writeFileSync(networkFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment data saved to: ${networkFile}`);
  }

  displaySummary() {
    console.log('\n🎉 Deployment Summary');
    console.log('=====================');
    console.log(`Network: ${this.network.name}`);
    console.log(`Chain ID: ${this.network.chainId}`);
    console.log(`\n📋 Contract Addresses:`);
    console.log(`PoEPVerifier: ${this.deployments.verifier.address}`);
    console.log(`PoEP:         ${this.deployments.poep.address}`);

    console.log(`\n🔍 Explorer Links:`);
    console.log(`PoEPVerifier: ${this.network.explorerUrl}/address/${this.deployments.verifier.address}`);
    console.log(`PoEP:         ${this.network.explorerUrl}/address/${this.deployments.poep.address}`);

    console.log(`\n📝 Next Steps:`);
    console.log(`1. Verify contracts on ${this.network.name.split(' ')[0]}scan`);
    console.log(`2. Update .env file with contract addresses`);
    console.log(`3. Run the indexer bot to monitor trust scores`);
    console.log(`4. Test the complete flow in the mini-app`);
  }
}

// Verification helper
async function verifyContract(address, constructorArgs = []) {
  try {
    console.log(`🔍 Verifying contract at ${address}...`);

    await hre.run('verify:verify', {
      address: address,
      constructorArguments: constructorArgs,
    });

    console.log(`✅ Contract verified successfully`);
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log(`ℹ️ Contract already verified`);
    } else {
      console.error(`❌ Verification failed:`, error.message);
    }
  }
}

// Main deployment function
async function main() {
  const network = process.argv[2] || 'baseSepolia';

  if (!NETWORKS[network]) {
    console.error(`❌ Unknown network: ${network}`);
    console.log(`Available networks: ${Object.keys(NETWORKS).join(', ')}`);
    process.exit(1);
  }

  const deployer = new ContractDeployer(network);
  const deployments = await deployer.deploy();

  // Verify contracts if requested
  if (process.argv.includes('--verify')) {
    console.log('\n🔍 Starting contract verification...');

    await verifyContract(deployments.verifier.address);
    await verifyContract(deployments.poep.address, deployments.poep.constructorArgs);
  }

  console.log('\n✨ Deployment complete!');
}

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { ContractDeployer, verifyContract };