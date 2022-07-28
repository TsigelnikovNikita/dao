//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: don't forget remove this after ending development!
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Timers.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Core of the Decentralized Autonomous Organisation system
 *
 * @author Nikita Tsigelnikov
 */
contract DAO is Ownable {
    using Timers for Timers.BlockNumber;

    IERC20 public immutable voteToken;
    uint256 public minimumQuorum;
    uint256 public debatingPeriodDuration;

    enum ProposalState {
        Debated,
        Executed,
        Defeated,
        DebateFinished
    }

    struct Proposal {
        uint256 yes;
        uint256 no;
        bool executed;
        bool defeated;
        Timers.BlockNumber endTime;
        mapping(address => bool) voted;
    }

    mapping(address => uint256) public deposits;
    mapping(uint256 => Proposal) public proposals;

    /**
     * @dev Emitted from {addProposal} function
     */
    event ProposalCreated(
        uint256 indexed proposalId,
        address[] recipients,
        bytes[] calldatas,
        uint256[] values,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    /**
     * @dev Emitted from {addProposal} function
     */
    event castVoted(uint256 indexed proposalId, address voter, uint256 votePower, bool forOrAgainst);
    /**
     * @dev Emitted from {finishProposal} function
     */
    event ProposalExecuted(uint256 indexed proposalId);
    /**
     * @dev Emitted from {finishProposal} function
     */
    event ProposalDefeated(uint256 indexed proposalId);

    /**
     * @param chairPerson Admin of the DAO. Only `chairPerson` can create proposals
     * @param _voteToken tokens for votes
     * @param _minimumQuorum minimal amount of votes for one proposal
     * @param _debatingPeriodDuration life time of the proposal
     */
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

    /**
     * @notice Allows to add {amount} of tokens to the deposit of DAO. Your vote power is equal to your deposit.
     * You must to call the approve function for the DAO contract before {deposit} call
     *
     * @param amount amount of tokens you want to deposit
     */
    function deposit(uint256 amount) external {
        voteToken.transferFrom(msg.sender, address(this), amount);

        deposits[msg.sender] += amount;
    }

    /**
     * @notice Allows to add a new Proposal to the DAO. This function can call only {owner}.
     * Every Proposal must be an unique
     *
     * @param recipients addresses array whose functions (or just call) will be called
     * @param calldatas array of the calldatas for call funciton
     * @param values array of the amount of ether will be sended
     * @param description description of proposal
     *
     * @dev Emits {ProposalCreated} event
     */
    function addProposal(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values,
        string calldata description
    ) external onlyOwner {
        require(recipients.length == values.length, "DAO: invalid proposal length");
        require(recipients.length == calldatas.length, "DAO: invalid proposal length");
        require(recipients.length > 0, "DAO: empty proposal");

        uint256 proposalId = hashProposal(recipients, calldatas, values, keccak256(bytes(description)));

        Proposal storage proposal = proposals[proposalId];

        require(proposal.endTime.isUnset(), "DAO: proposal is already created");

        proposal.endTime.setDeadline(uint64(block.number + debatingPeriodDuration));
        proposal.yes = deposits[msg.sender];

        emit ProposalCreated(
            proposalId,
            recipients,
            calldatas,
            values,
            description,
            block.number,
            block.number + debatingPeriodDuration
        );
    }

    /**
     * @notice Allows to cast vote for or against the proposal with `proposalId`
     *
     * @param proposalId id of proposal
     * @param votePower amount of vote
     * @param forOrAgainst true - for, false - against
     *
     * @dev Emits {castVoted} event
     */
    function castVote(
        uint256 proposalId,
        uint256 votePower,
        bool forOrAgainst
    ) external {
        require(proposalState(proposalId) == ProposalState.Debated, "DAO: proposal is not debated");
        require(votePower <= deposits[msg.sender], "DAO: not enough deposit");

        Proposal storage proposal = proposals[proposalId];
        require(!proposal.voted[msg.sender], "DAO: You have already voted");

        proposal.voted[msg.sender] = true;

        if (forOrAgainst == true) {
            proposal.yes += votePower;
        } else {
            proposal.no += votePower;
        }

        emit castVoted(proposalId, msg.sender, votePower, forOrAgainst);
    }

    /**
     * @notice Allows to finish proposal if debate period is ended. Will execute proposal if quorum is enough
     * and 'for' votes is greater than 'against'
     *
     * @param recipients see {addProposal} function
     * @param calldatas  see {addProposal} function
     * @param values  see {addProposal} function
     * @param descriptionHash hash of the proposal description
     *
     * @dev Emits {ProposalExecuted} event if proposal was executed and {ProposalDefeated} otherwise
     */
    function finishProposal(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values,
        bytes32 descriptionHash
    ) external {
        uint256 proposalId = hashProposal(recipients, calldatas, values, descriptionHash);
        require(proposalState(proposalId) == ProposalState.DebateFinished, "DAO: proposal debate is not finished");

        Proposal storage proposal = proposals[proposalId];
        require(minimumQuorum <= proposal.yes + proposal.no, "DAO: minimum quorum has not reached");

        if (proposal.yes > proposal.no) {
            proposal.executed = true;
            emit ProposalExecuted(proposalId);
            _execute(recipients, calldatas, values);
        } else {
            proposal.defeated = true;
            emit ProposalDefeated(proposalId);
        }
    }

    /**
     * @notice Allows to get proposal hash by {recipients}, {calldatas}, {values}, {descriptionHash}.
     *
     * @return proposal hash (or proposalID) in uint256
     */
    function hashProposal(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values,
        bytes32 descriptionHash
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(recipients, calldatas, values, descriptionHash)));
    }

    /**
     * @dev Current state of a proposal
     *
     * @return state return one of the {ProposalState} enum
     */
    function proposalState(uint256 proposalId) public view returns (ProposalState state) {
        Proposal storage proposal = proposals[proposalId];

        // proposal must exists
        require(proposal.endTime.isStarted(), "DAO: no such proposal");

        if (proposal.defeated) {
            return ProposalState.Defeated;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number >= proposal.endTime.getDeadline()) {
            return ProposalState.DebateFinished;
        } else {
            return ProposalState.Debated;
        }
    }

    function _execute(
        address[] calldata recipients,
        bytes[] calldata calldatas,
        uint256[] calldata values
    ) private {
        for (uint256 i = 0; i < calldatas.length; ++i) {
            require(address(this).balance >= values[i], "DAO: insufficient balance");
            (bool success, bytes memory returndata) = recipients[i].call{value: values[i]}(calldatas[i]);
            Address.verifyCallResult(success, returndata, "DAO: error without error message");
        }
    }
}
