# Basic Hardhat Project Template

This is a simple template of hardhat project used to TypeScript. Template contains a lot of useful packages for
smart-contract developing. You can find all of these in the `hardhat.config.ts` file.

You also can setting up settings of this config using .env file:
- `COMPILE_VERSION`: version of solc compile what you want to use. By default is "0.8.4".
- `OPTIMIZER`: enable (true) or disable (false) optimizer of the compliler. By default is
false.
- `OPTIMIZER_RUNS`: amount of runs for your optimizer. By default it is 200.
- `REPORT_GAS`: enable (true) or disable (false) report about spended gas by your contract.
This report will be generated when running test. By default is false.
- `DEFAULT_NETWORK`: default network will be used when you run tasks, scripts and test. By
default is "hardhat".
- `RINKEBY_NETWORK_URI`: URI of the Rinkeby RPC server. By default is empty. If you won't add
this variable, you won't be able to use this network.
- `SIGNER_PRIVATE_KEY`: private key of your address. By default is empty. If you won't add this
variable, you won't be able to use any additional network.
- `ETHERSCAN_API_KEY`: your api key of [etherscan explorer](https://etherscan.io/). It used for
verification your smart-contract.

It's **strongly recommended** don't add your private info (such as api keys or private keys) into the
project files dirrectly and use .env file or environment variables!

## How to use it?
- clone the repo directly in your working directory using
`git clone https://github.com/TsigelnikovNikita/hardhat_template .`;
- remove .git directory of this repo using `rm -rf .git`;
- install all dependencies using `npm i --save-dev`;

## What you can do?

# Storage layout
You can use `script/storage-layout.js` script for checking storage layout of your
smart-contract.
