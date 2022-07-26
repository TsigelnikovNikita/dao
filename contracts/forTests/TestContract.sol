//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: don't forget remove this after ending development!
import "hardhat/console.sol";


contract TestContract {
    uint public value;

    function changeValue(uint newValue) public {
        value = newValue;
    }
}
