import dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";  // https://www.npmjs.com/package/@nomicfoundation/hardhat-toolbox
import "hardhat-dependency-compiler";       // https://www.npmjs.com/package/hardhat-dependency-compiler
import "hardhat-storage-layout";            // https://www.npmjs.com/package/hardhat-storage-layout
import "hardhat-contract-sizer";            // https://www.npmjs.com/package/hardhat-contract-sizer
import "hardhat-abi-exporter";              // https://www.npmjs.com/package/hardhat-abi-exporter

task("accounts", "Prints the list of accounts", async (_, {ethers}) => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: process.env.COMPILE_VERSION || "0.8.0",
    settings: {
      optimizer: {
        enabled: process.env.OPTIMIZER == "true",
        runs: process.env.OPTIMIZER_RUNS || 200,
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      }
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS == "true"
  },
  defaultNetwork: process.env.DEFAULT_NETWORK || "hardhat",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URI || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  dependencyCompiler: { // add your dependencies here
    paths: [
      "@openzeppelin/contracts/access/Ownable.sol",
      "@openzeppelin/contracts/token/ERC20/IERC20.sol",
      "@openzeppelin/contracts/utils/Timers.sol"
    ],
  },
  abiExporter: {
    runOnCompile: process.env.ABI_EXPORTER == "true",
    only: [':TestContract$'],
  }
};

export default config;
