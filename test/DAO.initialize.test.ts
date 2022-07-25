import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAO__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("DAO.initialize", function () {
  const minimumQuorum = 100;
  const debatingPeriodDuration = 100;

  let DAO : DAO__factory;
  let chairPerson : SignerWithAddress;
  let voteToken : SignerWithAddress;

  async function daoInitializeFixture() {
    const [chairPerson, voteToken] = await ethers.getSigners();

    const DAO = await ethers.getContractFactory("DAO");

    return { DAO, chairPerson, voteToken };
  }

  beforeEach(async () => {
    ({ DAO, chairPerson, voteToken } = await loadFixture(daoInitializeFixture));
  });

  it("Must throw an exception if chairPerson address is zero", async function () {
    await expect(DAO.deploy(ethers.constants.AddressZero, voteToken.address, minimumQuorum, debatingPeriodDuration))
      .to.be.revertedWith("DAO: address can't be a zero");
  });

  it("Must throw an exception if voteToken address is zero", async function () {
    await expect(DAO.deploy(chairPerson.address, ethers.constants.AddressZero, minimumQuorum, debatingPeriodDuration))
      .to.be.revertedWith("DAO: address can't be a zero");
  });

  it("Must create DAO correctly", async function () {
    const dao = await DAO.deploy(chairPerson.address, voteToken.address, minimumQuorum, debatingPeriodDuration);

    expect(await dao.voteToken()).to.eq(voteToken.address);
    expect(await dao.owner()).to.eq(chairPerson.address);
    expect(await dao.minimumQuorum()).to.eq(minimumQuorum);
    expect(await dao.debatingPeriodDuration()).to.eq(debatingPeriodDuration);
  });
});
