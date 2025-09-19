const hre = require('hardhat');

async function main() {
  console.log('🚀 Deploying PoEP contract...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('📝 Deployer:', deployer.address);

  const verifierAddress = '0x420Da22BC8986c27aB6BD36B303a34e8c8e66100';
  const baseURI = 'https://poep-mini.vercel.app/api/metadata/';
  console.log('🔍 Using PoEPVerifier at:', verifierAddress);
  console.log('🌐 Using baseURI:', baseURI);

  const PoEP = await hre.ethers.getContractFactory('PoEP');
  const poep = await PoEP.deploy(baseURI, verifierAddress);

  await poep.waitForDeployment();
  const poepAddress = await poep.getAddress();

  console.log('✅ PoEP deployed to:', poepAddress);
  console.log('🔗 Verifier:', verifierAddress);

  console.log('\n📋 Update .env files with:');
  console.log(`NEXT_PUBLIC_POEP_CONTRACT_ADDRESS="${poepAddress}"`);
  console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS="${verifierAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });