import hre from "hardhat";

// Change name of contract here
const CONTRACT_NAME="CONTRACT_NAME";

/*
 * This script will generate and show report of storage layout of your contract using
 * hardhat-storage-layout package.
 * More details here: https://www.npmjs.com/package/hardhat-storage-layout
 */ 
async function main() {
    await hre.storageLayout.export();

    const contractFactory = await hre.ethers.getContractFactory(CONTRACT_NAME);
    const contract = await contractFactory.deploy();
    await contract.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  