import hre from 'hardhat';

async function main() {
  console.log('🚀 Deploying PoEP contracts to Base Mainnet...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('📝 Deployer:', deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Deployer balance:', hre.ethers.formatEther(balance), 'ETH');

  if (balance < hre.ethers.parseEther('0.001')) {
    throw new Error('Insufficient ETH balance for deployment (need at least 0.001 ETH)');
  }

  // 1. Deploy PoEPVerifier first
  console.log('\n1️⃣ Deploying PoEPVerifier...');
  const PoEPVerifier = await hre.ethers.getContractFactory('PoEPVerifier');
  const verifier = await PoEPVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log('✅ PoEPVerifier deployed to:', verifierAddress);

  // 2. Deploy PoEP with verifier
  console.log('\n2️⃣ Deploying PoEP...');
  const baseURI = 'https://peop-mini.vercel.app/api/metadata/';
  console.log('🌐 Using baseURI:', baseURI);

  const PoEP = await hre.ethers.getContractFactory('PoEP');
  const poep = await PoEP.deploy(baseURI, verifierAddress);
  await poep.waitForDeployment();
  const poepAddress = await poep.getAddress();
  console.log('✅ PoEP deployed to:', poepAddress);

  // 3. Verify contracts on BaseScan
  console.log('\n3️⃣ Verifying contracts...');

  try {
    console.log('Verifying PoEPVerifier...');
    await hre.run("verify:verify", {
      address: verifierAddress,
      constructorArguments: [],
    });
    console.log('✅ PoEPVerifier verified');
  } catch (error) {
    console.log('⚠️ PoEPVerifier verification failed:', error.message);
  }

  try {
    console.log('Verifying PoEP...');
    await hre.run("verify:verify", {
      address: poepAddress,
      constructorArguments: [baseURI, verifierAddress],
    });
    console.log('✅ PoEP verified');
  } catch (error) {
    console.log('⚠️ PoEP verification failed:', error.message);
  }

  console.log('\n🎉 Deployment complete!');
  console.log('\n📋 Update environment variables:');
  console.log('='.repeat(60));
  console.log(`NEXT_PUBLIC_POEP_CONTRACT_ADDRESS_MAINNET="${poepAddress}"`);
  console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS_MAINNET="${verifierAddress}"`);
  console.log('='.repeat(60));

  console.log('\n🔗 Contract URLs:');
  console.log(`PoEP: https://basescan.org/address/${poepAddress}`);
  console.log(`PoEPVerifier: https://basescan.org/address/${verifierAddress}`);

  console.log('\n⚠️ Important: Update your .env files with the above addresses');
  console.log('📝 Remember to set NEXT_PUBLIC_ENVIRONMENT="production" for mainnet');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });