//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: don't forget remove this after ending development!
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

contract DAO is Ownable {
    using Timers for Timers.BlockNumber;

    IERC20 public immutable voteToken;
    uint256 public minimumQuorum;
    uint256 public debatingPeriodDuration;

    struct Proposal {
        uint256 yes;
        uint256 no;
        bool executed;
        Timers.BlockNumber endTime;
    }

    mapping(address => uint256) public deposits;
    mapping(uint256 => Proposal) proposals;

    event ProposalIsCreated(
        uint256 proposalId,
        address[] recipients,
        bytes[] calldatas,
        uint256[] values,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    constructor(
        address chairPerson,
        address _voteToken,
        uint256 _minimumQuorum,
        uint256 _debatingPeriodDuration
    ) {
        require(chairPerson != address(0x0) && _voteToken != address(0x0), "DAO: address can't be a zero");

        transferOwnership(chairPerson);
        voteToken = IERC20(_voteToken);

        minimumQuorum = _minimumQuorum;
        debatingPeriodDuration = _debatingPeriodDuration;
    }

    function deposit(uint256 amount) external {
        voteToken.transferFrom(msg.sender, address(this), amount);

        deposits[msg.sender] += amount;
    }

    function addProposal(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values,
        string calldata description
    ) external onlyOwner {
        uint256 proposalId = hashProposal(recipients, calldatas, values, keccak256(abi.encode(description)));

        Proposal storage proposal = proposals[proposalId];

        require(proposal.endTime.isUnset(), "DAO: proposal is already created");

        proposal.endTime.setDeadline(uint64(block.number + debatingPeriodDuration));
        proposal.yes = deposits[msg.sender];

        emit ProposalIsCreated(
            proposalId,
            recipients,
            calldatas,
            values,
            description,
            block.number,
            block.number + debatingPeriodDuration
        );
    }

    function hashProposal(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values,
        bytes32 descriptionHash
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(recipients, calldatas, values, descriptionHash)));
    }
}
