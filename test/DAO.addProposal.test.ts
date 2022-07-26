import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { DAO, VoteToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { keccak256 } from "ethers/lib/utils";
import { getBlockNumber, hashProposal, ProposalState } from "./utils";

import abi from "../abi/contracts/forTests/TestContract.sol/TestContract.json";


describe("DAO.addProposal", function () {
  const minimumQuorum = 100;
  const debatingPeriodDuration = 100;
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("changeValue", [999]);
  const value = 10;
  const description = "Test description";
  const descriptionHash = keccak256(ethers.utils.toUtf8Bytes(description));

  let dao: DAO;
  let chairPerson: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: string;
  let proposalId: BigNumber;

  async function daoInitializeFixture() {
    const [chairPerson, user, recipient] = await ethers.getSigners();
    const proposalId = hashProposal(
      ["address[]", "bytes[]", "uint256[]", "bytes32"],
      [recipient.address], [calldata], [value], descriptionHash
    );

    const VoteToken = await ethers.getContractFactory("VoteToken", user);
    const voteToken = await VoteToken.deploy();
    await voteToken.connect(user).transfer(chairPerson.address, 100000000000);

    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(chairPerson.address, voteToken.address, minimumQuorum, debatingPeriodDuration);
    await voteToken.connect(chairPerson).approve(dao.address, 1000);
    await dao.connect(chairPerson).deposit(1000);

    return { dao, chairPerson, user, voteToken, recipient: recipient.address, proposalId };
  }

  beforeEach(async () => {
    ({ dao, chairPerson, user, recipient, proposalId } = await loadFixture(daoInitializeFixture));
  });

  it("Must throw an expection if chairPerson is caller", async () => {
    await expect(dao.connect(user).addProposal([recipient], [calldata], [value], description))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Must throw an expection if proposal is empty", async () => {
    await expect(dao.connect(chairPerson).addProposal([], [], [], description))
      .to.be.revertedWith("DAO: empty proposal");
  });

  it("Must throw an expection if proposal length is invalid", async () => {
    await expect(dao.connect(chairPerson).addProposal([], [calldata], [value], description))
      .to.be.revertedWith("DAO: invalid proposal length");

    await expect(dao.connect(chairPerson).addProposal([recipient], [], [value], description))
      .to.be.revertedWith("DAO: invalid proposal length");

    await expect(dao.connect(chairPerson).addProposal([recipient], [calldata], [], description))
      .to.be.revertedWith("DAO: invalid proposal length");
  });

  it("Must create proposal correctly", async () => {
    await dao.connect(chairPerson).addProposal([recipient], [calldata], [value], description);

    const proposal = await dao.proposals(proposalId);

    expect(await dao.proposalState(proposalId)).to.eq(ProposalState.Debated);
    expect(proposal.endTime._deadline).to.eq((await getBlockNumber()) + debatingPeriodDuration);
    expect(proposal.yes).to.eq(await dao.deposits(chairPerson.address));
    expect(proposal.no).to.eq(0);
    expect(proposal.executed).to.eq(false);
  });

  it("Must throw an expection if try to create proposal twice", async () => {
    await dao.connect(chairPerson).addProposal([recipient], [calldata], [value], description);

    await expect(dao.connect(chairPerson).addProposal([recipient], [calldata], [value], description))
      .to.be.revertedWith("DAO: proposal is already created");
  });

  it("Must emit ProposalCreated event", async () => {
    await expect(dao.connect(chairPerson).addProposal([recipient], [calldata], [value], description))
      .to.emit(dao, "ProposalCreated")
      .withArgs(
        proposalId, // id
        [recipient], // recipients
        [calldata], // calldatas
        [value], // values
        description, // description
        await getBlockNumber(), // startTime
        await getBlockNumber() + debatingPeriodDuration, // endTime
      );
  });
});
