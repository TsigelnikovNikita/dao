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


describe("DAO.withdraw", function () {
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
});
