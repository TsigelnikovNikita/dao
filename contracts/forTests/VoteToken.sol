//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: don't forget remove this after ending development!
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract VoteToken is ERC20 {
    constructor() ERC20("voteToken", "voteToken") {
        _mint(msg.sender, 10000 * 10**18);
    }
}
