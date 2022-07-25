//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: don't forget remove this after ending development!
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAO is Ownable {
    IERC20 public immutable voteToken;
    uint256 public minimumQuorum;
    uint256 public debatingPeriodDuration;

    constructor(
        address chairPerson,
        address _voteToken,
        uint256 _minimumQuorum,
        uint256 _debatingPeriodDuration
    ) {
        transferOwnership(chairPerson);
        voteToken = IERC20(_voteToken);
        minimumQuorum = _minimumQuorum;
        debatingPeriodDuration = _debatingPeriodDuration;
    }
}
