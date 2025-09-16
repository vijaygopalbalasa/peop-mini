#!/usr/bin/env node

/**
 * Deploy just the PoEP main contract to Base mainnet
 */

import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VERIFIER_ADDRESS = '0x73B06334Ff319a028d0A4d749352874DF581e02e';

async function deployPoEP() {
  console.log('🚀 Deploying PoEP main contract to Base Mainnet...');

  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📝 Deployer address: ${wallet.address}`);
  console.log(`📋 PoEPVerifier address: ${VERIFIER_ADDRESS}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  try {
    const poepArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PoEP.sol/PoEP.json', 'utf8'));
    const baseURI = `${process.env.NEXT_PUBLIC_URL}/api/metadata`;

    console.log('📄 Deploying PoEP main contract...');
    const PoEPFactory = new ethers.ContractFactory(poepArtifact.abi, poepArtifact.bytecode, wallet);

    const poep = await PoEPFactory.deploy(VERIFIER_ADDRESS, baseURI, {
      gasLimit: 4000000,
      gasPrice: ethers.parseUnits('0.01', 'gwei')
    });

    await poep.waitForDeployment();
    const poepAddress = await poep.getAddress();

    console.log(`✅ PoEP deployed at: ${poepAddress}`);
    console.log(`\n🎉 BASE MAINNET DEPLOYMENT COMPLETE!`);
    console.log(`========================================`);
    console.log(`PoEPVerifier: ${VERIFIER_ADDRESS}`);
    console.log(`PoEP:         ${poepAddress}`);
    console.log(`\n🔍 Explorer Links:`);
    console.log(`PoEPVerifier: https://basescan.org/address/${VERIFIER_ADDRESS}`);
    console.log(`PoEP:         https://basescan.org/address/${poepAddress}`);
    console.log(`\n📝 Update your .env file:`);
    console.log(`NEXT_PUBLIC_POEP_CONTRACT_ADDRESS="${poepAddress}"`);
    console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS="${VERIFIER_ADDRESS}"`);

    return poepAddress;

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployPoEP().then(() => {
  console.log('\n✨ Ready for production! 🚀');
  process.exit(0);
}).catch(console.error);