import hre from 'hardhat';

async function main() {
  console.log('🚀 Deploying PoEPVerifier contract (3-input version)...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('📝 Deployer:', deployer.address);

  const PoEPVerifier = await hre.ethers.getContractFactory('PoEPVerifier');
  const verifier = await PoEPVerifier.deploy();

  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();

  console.log('✅ PoEPVerifier deployed to:', verifierAddress);

  // Test that it accepts 1 public signal
  console.log('🧪 Testing verifier signature...');

  // Create dummy proof data to test function signature
  const dummyProof = {
    pA: [1, 2],
    pB: [[1, 2], [3, 4]],
    pC: [5, 6],
    publicSignals: [12345] // Only 1 public signal (nullifier)
  };

  try {
    // This should not revert on the function signature
    await verifier.verifyProof.staticCall(
      dummyProof.pA,
      dummyProof.pB,
      dummyProof.pC,
      dummyProof.publicSignals
    );
    console.log('✅ Verifier accepts 1 public signal (nullifier)');
  } catch (error) {
    if (error.message.includes('signature')) {
      console.log('❌ Function signature mismatch');
      console.error(error.message);
    } else {
      console.log('✅ Function signature OK (proof verification failed as expected)');
    }
  }

  console.log('\\n📋 Update .env files with:');
  console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS="${verifierAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });