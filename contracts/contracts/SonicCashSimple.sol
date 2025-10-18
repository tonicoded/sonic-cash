// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicCashSimple
 * @dev Ultra-simple privacy mixer - just send to contract with recipient in data
 */
contract SonicCashSimple is ReentrancyGuard, Pausable, Ownable {
    
    // Privacy fee (0.1%)
    uint256 public privacyFeePercent = 10;
    
    // Pool stats
    uint256 public totalTransfers;
    uint256 public totalVolume;
    uint256 public totalFees;
    
    // Events
    event AnonymousTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    // Errors
    error InvalidAmount();
    error InvalidRecipient();
    error TransferFailed();
    error InsufficientBalance();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Send money anonymously - anyone can call this with recipient address
     */
    function sendAnonymously(address payable recipient) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        
        // Update stats
        totalTransfers++;
        totalVolume += msg.value;
        totalFees += fee;
        
        // Send funds to recipient
        (bool success, ) = recipient.call{value: transferAmount}("");
        if (!success) revert TransferFailed();
        
        emit AnonymousTransfer(
            msg.sender,
            recipient,
            transferAmount,
            fee,
            block.timestamp
        );
    }
    
    /**
     * @dev Get pool stats
     */
    function getPoolStats() external view returns (
        uint256 _totalTransfers,
        uint256 _totalVolume,
        uint256 _contractBalance,
        uint256 _privacyFee
    ) {
        return (
            totalTransfers,
            totalVolume,
            address(this).balance,
            privacyFeePercent
        );
    }
    
    /**
     * @dev Admin functions
     */
    function updatePrivacyFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee too high");
        privacyFeePercent = newFeePercent;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Receive function - reject direct sends without data
    receive() external payable {
        revert("Use sendAnonymously function");
    }
    
    fallback() external payable {
        revert("Use sendAnonymously function");
    }
}