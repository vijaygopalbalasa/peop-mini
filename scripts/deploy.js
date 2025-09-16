import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("Deploying PoEP contracts to Base Mainnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the verifier first
  console.log("\n1. Deploying PoEPVerifier...");
  const PoEPVerifier = await ethers.getContractFactory("PoEPVerifier");
  const verifier = await PoEPVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("PoEPVerifier deployed to:", verifierAddress);

  // Deploy the main PoEP contract
  console.log("\n2. Deploying PoEP contract...");
  const baseURI = "https://peop-mini.vercel.app/api/metadata/";
  const PoEP = await ethers.getContractFactory("PoEP");
  const poep = await PoEP.deploy(verifierAddress, baseURI);
  await poep.waitForDeployment();
  const poepAddress = await poep.getAddress();
  console.log("PoEP contract deployed to:", poepAddress);

  // Log deployment info
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Network: Base Mainnet");
  console.log("PoEPVerifier:", verifierAddress);
  console.log("PoEP Contract:", poepAddress);
  console.log("Base URI:", baseURI);

  console.log("\n=== ENVIRONMENT VARIABLES ===");
  console.log(`NEXT_PUBLIC_POEP_CONTRACT_ADDRESS="${poepAddress}"`);
  console.log(`NEXT_PUBLIC_POEPVERIFIER_CONTRACT_ADDRESS="${verifierAddress}"`);

  console.log("\n=== VERIFICATION COMMANDS ===");
  console.log(`npx hardhat verify --network baseMainnet ${verifierAddress}`);
  console.log(`npx hardhat verify --network baseMainnet ${poepAddress} "${verifierAddress}" "${baseURI}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });