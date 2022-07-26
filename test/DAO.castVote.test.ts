import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { DAO, VoteToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { keccak256 } from "ethers/lib/utils";
import { getBlockNumber, hashProposal, mineBlocks, ProposalState } from "./utils";

import abi from "../abi/contracts/forTests/TestContract.sol/TestContract.json";


describe("DAO.castVote", function () {
  const minimumQuorum = 100;
  const debatingPeriodDuration = 100;
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("changeValue", [999]);
  const value = 10;
  const description = "Test description";
  const descriptionHash = keccak256(ethers.utils.toUtf8Bytes(description));

  let voteToken: VoteToken;
  let dao: DAO;
  let chairPerson: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: string;
  let proposalId : BigNumber;

  async function daoInitializeFixture() {
    const [chairPerson, user, recipient] = await ethers.getSigners();
    const proposalId = hashProposal(
      ["address[]", "bytes[]", "uint256[]", "bytes32"],
      [recipient.address], [calldata], [value], descriptionHash
      );

    const VoteToken = await ethers.getContractFactory("VoteToken", user);
    const voteToken = await VoteToken.deploy();

    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(chairPerson.address, voteToken.address, minimumQuorum, debatingPeriodDuration);

    await voteToken.connect(user).approve(dao.address, 10000);
    await dao.connect(chairPerson).addProposal([recipient.address], [calldata], [value], description);

    return { dao, chairPerson, user, voteToken, recipient: recipient.address, proposalId };
  }

  beforeEach(async () => {
    ({ voteToken, dao, chairPerson, user, recipient, proposalId } = await loadFixture(daoInitializeFixture));
  });

  it("Must throw an expection if proposal doesn't exist", async () => {
    await expect(dao.connect(user).castVote(0, 1, true))
      .to.be.revertedWith("DAO: no such proposal");
  });

  it("Must throw an expection if proposal is debated", async () => {
    await mineBlocks(debatingPeriodDuration);

    await expect(dao.connect(user).castVote(proposalId, 100, true))
      .to.be.revertedWith("DAO: proposal is not debated");
  });

  it("Must throw an expection if not enough deposit", async () => {
    await expect(dao.connect(user).castVote(proposalId, 100000, true))
      .to.be.revertedWith("DAO: not enough deposit");
  });

  it("Must throw an expection if user has already voted", async () => {
    await dao.connect(user).deposit(1000);
    await dao.connect(user).castVote(proposalId, 1, true);

    await expect(dao.connect(user).castVote(proposalId, 1, true))
      .to.be.revertedWith("DAO: You have already voted");
  });

  it("Must cast vote for correctly", async () => {
    await dao.connect(user).deposit(1000);
    const proposalBefore = await dao.proposals(proposalId);

    await dao.connect(user).castVote(proposalId, 100, true);

    const proposalAfter = await dao.proposals(proposalId);

    expect(proposalAfter.yes.sub(proposalBefore.yes)).to.eq(100);
  });

  it("Must cast vote against correctly", async () => {
    await dao.connect(user).deposit(1000);
    const proposalBefore = await dao.proposals(proposalId);

    await dao.connect(user).castVote(proposalId, 100, false);

    const proposalAfter = await dao.proposals(proposalId);

    expect(proposalAfter.no.sub(proposalBefore.no)).to.eq(100);
  });

  it("Must emit castVoted event", async () => {
    await dao.connect(user).deposit(1000);

    await expect(dao.connect(user).castVote(proposalId, 100, false))
      .to.emit(dao, "castVoted")
      .withArgs(
        proposalId,
        user.address,
        100,
        false
      );
  });
});
