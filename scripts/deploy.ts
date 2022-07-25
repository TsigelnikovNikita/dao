import { ethers } from "hardhat";

const CONTRACT_NAME="CONTRACT_NAME";

async function main() {
    const contractFactory = await ethers.getContractFactory(CONTRACT_NAME);

    const contract = await contractFactory.deploy();
    await contract.deployed();
    console.log(`${CONTRACT_NAME} deployed to: ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
