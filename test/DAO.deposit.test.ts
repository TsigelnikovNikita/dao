import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAO, VoteToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("DAO.deposit", function () {
  const minimumQuorum = 100;
  const debatingPeriodDuration = 100;

  let voteToken: VoteToken;
  let dao: DAO;
  let chairPerson: SignerWithAddress;
  let user: SignerWithAddress;

  async function daoInitializeFixture() {
    const [chairPerson, user] = await ethers.getSigners();

    const VoteToken = await ethers.getContractFactory("VoteToken", user);
    const voteToken = await VoteToken.deploy();

    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(chairPerson.address, voteToken.address, minimumQuorum, debatingPeriodDuration);

    await voteToken.approve(dao.address, 100000000);

    return { dao, chairPerson, user, voteToken };
  }

  beforeEach(async () => {
    ({ voteToken, dao, chairPerson, user } = await loadFixture(daoInitializeFixture));
  });

  it("Must throw an exception if insuffitient balance", async function () {
    await expect(dao.connect(chairPerson).deposit(100))
      .to.be.rejectedWith("ERC20: insufficient allowance");
  });

  it("Must transfer tokens correctly", async function () {
    await expect(() => dao.connect(user).deposit(100))
      .to.changeTokenBalances(voteToken, [dao, user], [100, -100]);
  });

  it("Must change deposit correctly", async function () {
    expect(await dao.deposits(user.address)).to.eq(0);

    await dao.connect(user).deposit(100);

    expect(await dao.deposits(user.address)).to.eq(100);
  });
});
