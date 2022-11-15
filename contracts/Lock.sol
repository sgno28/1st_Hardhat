// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

// Re-typing the contract code to learn

contract Lock {
    uint public unlockTime;

    // Similar to openzepplins onlyOwner access/Ownable.sol modifier
    address payable public owner;

    event Withdrawal(uint amount, uint when);

    constructor(uint _unlockTime) payable {
        // Deployed with an unlock time and set amount of eth
        // Require that the unlocktime is NOT in the past       
        require(block.timestamp < _unlockTime, "Please set an unlock time that is in the future");
        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function withdraw() public {
        require(block.timestamp >= unlockTime, "Withdrawal not ready yet!");
        require(msg.sender == owner, "Only owner can withdraw!");

        emit Withdrawal(address(this).balance, block.timestamp);
        owner.transfer(address(this).balance);
    }
}

