import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractName } from "../typechain-types";

describe("ContractName.initialize", function () {
  let contractName : ContractName;

  async function contractNameInitializeFixture() {
    const [owner] = await ethers.getSigners();

    const ContractName = await ethers.getContractFactory("ContractName");
    const contractName = await ContractName.deploy();
    await contractName.deployed();

    return { contractName, owner };
  }

  beforeEach(async () => {
    ({ contractName } = await loadFixture(contractNameInitializeFixture));
  });

  it("Must ...", async function () {

  });
});
