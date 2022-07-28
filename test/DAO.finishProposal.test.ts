import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { DAO } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { keccak256 } from "ethers/lib/utils";
import { hashProposal, mineBlocks, ProposalState } from "./utils";

import abi from "../abi/contracts/forTests/TestContract.sol/TestContract.json";
import { TestContract } from "../typechain-types/contracts/forTests/TestContract.sol";


describe("DAO.finishProposal", function () {
  const minimumQuorum = 100;
  const debatingPeriodDuration = 100;
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("changeValue", [999]);
  const value = 0;
  const description = "Test description";
  const descriptionHash = keccak256(ethers.utils.toUtf8Bytes(description));

  let dao: DAO;
  let testContract : TestContract;
  let chairPerson: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: string;
  let proposalId: BigNumber;

  async function daoInitializeFixture() {
    const [chairPerson, user] = await ethers.getSigners();

    const TestContract = await ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const proposalId = hashProposal(
      ["address[]", "bytes[]", "uint256[]", "bytes32"],
      [testContract.address], [calldata], [value], descriptionHash
    );

    const VoteToken = await ethers.getContractFactory("VoteToken", user);
    const voteToken = await VoteToken.deploy();

    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(chairPerson.address, voteToken.address, minimumQuorum, debatingPeriodDuration);
    await voteToken.connect(user).approve(dao.address, 10000);
    await dao.connect(user).deposit(10000);

    await dao.connect(chairPerson).addProposal([testContract.address], [calldata], [value], description);
    return { dao, chairPerson, user, voteToken, recipient: testContract.address, proposalId, testContract };
  }

  beforeEach(async () => {
    ({ dao, chairPerson, user, recipient, proposalId, testContract } = await loadFixture(daoInitializeFixture));
  });

  it("Must throw an expection if proposal doesn't exist", async () => {
    await expect(dao.connect(chairPerson).finishProposal([], [], [], descriptionHash))
      .to.be.revertedWith("DAO: no such proposal");
  });

  it("Must throw an expection if proposal is not in the Debated state", async () => {
    await expect(dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash))
      .to.be.revertedWith("DAO: proposal debate is not finished");
  });

  it("Must throw an expection if minimum quorum has not reached", async () => {
    await mineBlocks(debatingPeriodDuration);

    await expect(dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash))
      .to.be.revertedWith("DAO: minimum quorum has not reached");
  });

  it("Must execute proposal correctly if votes amount 'yes' greater than 'no'", async () => {
    await dao.connect(user).castVote(proposalId, 10000, true);
    await mineBlocks(debatingPeriodDuration);

    await dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash);

    expect(await testContract.value()).to.eq(999);
    expect(await dao.proposalState(proposalId)).to.eq(ProposalState.Executed);
  });

  it("Must emit ProposalExecuted event if votes amount 'yes' greater than 'no'", async () => {
    await dao.connect(user).castVote(proposalId, 10000, true);
    await mineBlocks(debatingPeriodDuration);

    await expect(dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash))
      .to.emit(dao, "ProposalExecuted")
      .withArgs(proposalId);
  });

  it("Must not execute proposal correctly if votes amount 'no' greater than 'yes'", async () => {
    await dao.connect(user).castVote(proposalId, 10000, false);
    await mineBlocks(debatingPeriodDuration);

    await dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash);

    expect(await testContract.value()).to.eq(0);
    expect(await dao.proposalState(proposalId)).to.eq(ProposalState.Defeated);
  });

  it("Must emit ProposalDefeated event if votes amount 'no' greater than 'yes'", async () => {
    await dao.connect(user).castVote(proposalId, 10000, false);
    await mineBlocks(debatingPeriodDuration);

    await expect(dao.connect(chairPerson).finishProposal([recipient], [calldata], [value], descriptionHash))
      .to.emit(dao, "ProposalDefeated")
      .withArgs(proposalId);
  });
});
