import hre from 'hardhat';

async function main() {
  console.log('🔍 Checking verifier address in deployed contract...');

  const contract = await hre.ethers.getContractAt('PoEP', '0x5A838Ba11E54847b0dCD80Fa6F69c4b82Ff680b7');
  const verifierAddress = await contract.zkVerifier();

  console.log('Current contract verifier address:', verifierAddress);
  console.log('Expected verifier address: 0xEb23912a659d7CCa98624eA975487B9C82c9dEDb');
  console.log('Addresses match:', verifierAddress.toLowerCase() === '0xEb23912a659d7CCa98624eA975487B9C82c9dEDb'.toLowerCase());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });