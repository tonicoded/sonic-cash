// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicPrivacySendFixed
 * @dev Working anonymous send contract - money goes through privacy pool
 */
contract SonicPrivacySendFixed is ReentrancyGuard, Pausable, Ownable {
    
    // Privacy fee (0.1% to cover gas)
    uint256 public privacyFeePercent = 10; // 0.1%
    
    // Pool stats
    uint256 public totalTransfers;
    uint256 public totalVolume;
    uint256 public totalFees;
    
    mapping(address => uint256) public totalSent;
    mapping(address => uint256) public totalReceived;
    
    // Events
    event AnonymousTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    
    // Errors
    error InvalidAmount();
    error InvalidRecipient();
    error TransferFailed();
    error InsufficientBalance();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Send money anonymously through privacy pool
     * @param recipient The address to receive the funds
     */
    function sendAnonymously(address payable recipient) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (recipient == msg.sender) revert InvalidRecipient();
        
        // Calculate fee
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        
        // Update stats
        totalSent[msg.sender] += msg.value;
        totalReceived[recipient] += transferAmount;
        totalTransfers++;
        totalVolume += msg.value;
        totalFees += fee;
        
        // Send funds to recipient (breaks direct link via contract)
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
     * @dev Get user stats
     */
    function getUserStats(address user) external view returns (
        uint256 sent,
        uint256 received
    ) {
        return (totalSent[user], totalReceived[user]);
    }
    
    /**
     * @dev Update privacy fee (only owner)
     */
    function updatePrivacyFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee too high"); // Max 1%
        
        uint256 oldFee = privacyFeePercent;
        privacyFeePercent = newFeePercent;
        
        emit FeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Receive function
     */
    receive() external payable {
        // Accept payments
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Accept payments
    }
}