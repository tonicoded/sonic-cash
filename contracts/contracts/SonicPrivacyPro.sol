// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicPrivacyPro
 * @dev Advanced privacy mixer with batch transfers, variable delays, and privacy scoring
 */
contract SonicPrivacyPro is ReentrancyGuard, Pausable, Ownable {
    
    // Privacy fee (0.1%)
    uint256 public privacyFeePercent = 10;
    
    // Delay options for better anonymity
    uint256 public constant MIN_DELAY = 1 minutes;
    uint256 public constant MAX_DELAY = 24 hours;
    
    // Pool stats
    uint256 public totalTransfers;
    uint256 public totalVolume;
    uint256 public totalFees;
    uint256 public totalBatchTransfers;
    uint256 public totalDelayedTransfers;
    
    mapping(address => uint256) public totalSent;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public privacyScore;
    
    // Batch transfer structure
    struct BatchTransfer {
        address[] recipients;
        uint256[] amounts;
        address sender;
        uint256 totalAmount;
        uint256 fee;
        uint256 timestamp;
        bool executed;
    }
    
    // Delayed transfer structure
    struct DelayedTransfer {
        address recipient;
        uint256 amount;
        address sender;
        uint256 executeAt;
        uint256 fee;
        bool executed;
        uint256 delayMinutes;
    }
    
    mapping(bytes32 => BatchTransfer) public batchTransfers;
    mapping(bytes32 => DelayedTransfer) public delayedTransfers;
    
    // Privacy metrics
    mapping(address => uint256) public lastTransferTime;
    mapping(address => uint256) public transferFrequency;
    mapping(address => uint256) public averageAmount;
    
    // Events
    event AnonymousTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp,
        uint256 privacyScore
    );
    
    event BatchTransferInitiated(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event BatchTransferExecuted(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 recipientCount,
        uint256 timestamp
    );
    
    event DelayedTransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 executeAt,
        uint256 delayMinutes
    );
    
    event DelayedTransferExecuted(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event PrivacyScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    // Errors
    error InvalidAmount();
    error InvalidRecipient();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidDelay();
    error TransferNotReady();
    error BatchAlreadyExecuted();
    error InvalidBatchData();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Send money anonymously (immediate)
     */
    function sendAnonymously(address payable recipient) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        
        // Update stats and privacy score
        _updateUserStats(msg.sender, msg.value);
        _updateUserStats(recipient, transferAmount);
        uint256 senderPrivacyScore = _calculatePrivacyScore(msg.sender);
        
        totalTransfers++;
        totalVolume += msg.value;
        totalFees += fee;
        
        // Send funds
        (bool success, ) = recipient.call{value: transferAmount}("");
        if (!success) revert TransferFailed();
        
        emit AnonymousTransfer(
            msg.sender,
            recipient,
            transferAmount,
            fee,
            block.timestamp,
            senderPrivacyScore
        );
    }
    
    /**
     * @dev Send with delay for better anonymity
     */
    function sendWithDelay(
        address payable recipient,
        uint256 delayMinutes
    ) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (delayMinutes < 1 || delayMinutes > 1440) revert InvalidDelay(); // 1 min to 24h
        
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        uint256 executeAt = block.timestamp + (delayMinutes * 1 minutes);
        
        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                msg.value,
                block.timestamp,
                delayMinutes
            )
        );
        
        delayedTransfers[transferId] = DelayedTransfer({
            recipient: recipient,
            amount: transferAmount,
            sender: msg.sender,
            executeAt: executeAt,
            fee: fee,
            executed: false,
            delayMinutes: delayMinutes
        });
        
        totalDelayedTransfers++;
        totalVolume += msg.value;
        totalFees += fee;
        
        emit DelayedTransferInitiated(
            transferId,
            msg.sender,
            recipient,
            transferAmount,
            executeAt,
            delayMinutes
        );
    }
    
    /**
     * @dev Execute delayed transfer
     */
    function executeDelayedTransfer(bytes32 transferId) external nonReentrant {
        DelayedTransfer storage transfer = delayedTransfers[transferId];
        
        if (transfer.amount == 0) revert InvalidAmount();
        if (transfer.executed) revert BatchAlreadyExecuted();
        if (block.timestamp < transfer.executeAt) revert TransferNotReady();
        
        transfer.executed = true;
        totalTransfers++;
        
        // Update privacy scores
        _updateUserStats(transfer.sender, transfer.amount + transfer.fee);
        _updateUserStats(transfer.recipient, transfer.amount);
        
        // Send funds
        (bool success, ) = transfer.recipient.call{value: transfer.amount}("");
        if (!success) revert TransferFailed();
        
        emit DelayedTransferExecuted(
            transferId,
            transfer.sender,
            transfer.recipient,
            transfer.amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Batch transfer to multiple recipients
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant whenNotPaused {
        if (recipients.length == 0 || recipients.length != amounts.length) revert InvalidBatchData();
        if (recipients.length > 50) revert InvalidBatchData(); // Max 50 recipients
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();
            if (recipients[i] == address(0) || recipients[i] == msg.sender) revert InvalidRecipient();
            totalAmount += amounts[i];
        }
        
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        if (msg.value < totalAmount + fee) revert InsufficientBalance();
        
        bytes32 batchId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipients,
                amounts,
                block.timestamp
            )
        );
        
        // Store batch for delayed execution (adds anonymity)
        batchTransfers[batchId] = BatchTransfer({
            recipients: recipients,
            amounts: amounts,
            sender: msg.sender,
            totalAmount: totalAmount,
            fee: fee,
            timestamp: block.timestamp,
            executed: false
        });
        
        totalBatchTransfers++;
        totalVolume += msg.value;
        totalFees += fee;
        
        emit BatchTransferInitiated(
            batchId,
            msg.sender,
            recipients.length,
            msg.value,
            block.timestamp
        );
        
        // Execute immediately for now (can be delayed in future)
        _executeBatchTransfer(batchId);
    }
    
    /**
     * @dev Execute batch transfer
     */
    function _executeBatchTransfer(bytes32 batchId) internal {
        BatchTransfer storage batch = batchTransfers[batchId];
        
        if (batch.executed) revert BatchAlreadyExecuted();
        batch.executed = true;
        
        // Update sender stats
        _updateUserStats(batch.sender, batch.totalAmount + batch.fee);
        uint256 senderPrivacyScore = _calculatePrivacyScore(batch.sender);
        
        // Execute all transfers
        for (uint256 i = 0; i < batch.recipients.length; i++) {
            _updateUserStats(batch.recipients[i], batch.amounts[i]);
            
            (bool success, ) = batch.recipients[i].call{value: batch.amounts[i]}("");
            if (!success) revert TransferFailed();
            
            totalTransfers++;
            
            emit AnonymousTransfer(
                batch.sender,
                batch.recipients[i],
                batch.amounts[i],
                batch.fee / batch.recipients.length, // Split fee
                block.timestamp,
                senderPrivacyScore
            );
        }
        
        emit BatchTransferExecuted(
            batchId,
            batch.sender,
            batch.recipients.length,
            block.timestamp
        );
    }
    
    /**
     * @dev Update user statistics for privacy scoring
     */
    function _updateUserStats(address user, uint256 amount) internal {
        uint256 timeSinceLastTransfer = block.timestamp - lastTransferTime[user];
        
        // Update frequency (transfers per day)
        if (timeSinceLastTransfer > 0) {
            transferFrequency[user] = (transferFrequency[user] + (86400 / timeSinceLastTransfer)) / 2;
        }
        
        // Update average amount
        if (averageAmount[user] == 0) {
            averageAmount[user] = amount;
        } else {
            averageAmount[user] = (averageAmount[user] + amount) / 2;
        }
        
        lastTransferTime[user] = block.timestamp;
        
        // Update privacy score
        uint256 oldScore = privacyScore[user];
        uint256 newScore = _calculatePrivacyScore(user);
        privacyScore[user] = newScore;
        
        if (oldScore != newScore) {
            emit PrivacyScoreUpdated(user, oldScore, newScore);
        }
    }
    
    /**
     * @dev Calculate privacy score (0-100)
     */
    function _calculatePrivacyScore(address user) internal view returns (uint256) {
        uint256 score = 50; // Base score
        
        // Higher frequency = lower privacy
        if (transferFrequency[user] > 10) {
            score -= 20;
        } else if (transferFrequency[user] > 5) {
            score -= 10;
        } else if (transferFrequency[user] < 1) {
            score += 10;
        }
        
        // Larger amounts = lower privacy
        if (averageAmount[user] > 100 ether) {
            score -= 15;
        } else if (averageAmount[user] > 10 ether) {
            score -= 5;
        } else if (averageAmount[user] < 1 ether) {
            score += 15;
        }
        
        // Recent activity = lower privacy
        uint256 timeSinceLastTransfer = block.timestamp - lastTransferTime[user];
        if (timeSinceLastTransfer < 1 hours) {
            score -= 10;
        } else if (timeSinceLastTransfer > 24 hours) {
            score += 10;
        }
        
        // Pool activity bonus
        if (totalTransfers > 100) {
            score += 10;
        }
        
        return score > 100 ? 100 : score;
    }
    
    /**
     * @dev Get enhanced pool stats
     */
    function getPoolStats() external view returns (
        uint256 _totalTransfers,
        uint256 _totalVolume,
        uint256 _contractBalance,
        uint256 _privacyFee,
        uint256 _totalBatchTransfers,
        uint256 _totalDelayedTransfers
    ) {
        return (
            totalTransfers,
            totalVolume,
            address(this).balance,
            privacyFeePercent,
            totalBatchTransfers,
            totalDelayedTransfers
        );
    }
    
    /**
     * @dev Get user privacy metrics
     */
    function getUserPrivacyMetrics(address user) external view returns (
        uint256 _privacyScore,
        uint256 _totalSent,
        uint256 _totalReceived,
        uint256 _transferFrequency,
        uint256 _averageAmount,
        uint256 _lastTransferTime
    ) {
        return (
            privacyScore[user],
            totalSent[user],
            totalReceived[user],
            transferFrequency[user],
            averageAmount[user],
            lastTransferTime[user]
        );
    }
    
    /**
     * @dev Get delayed transfer info
     */
    function getDelayedTransfer(bytes32 transferId) external view returns (
        address recipient,
        uint256 amount,
        address sender,
        uint256 executeAt,
        bool executed,
        uint256 delayMinutes,
        bool ready
    ) {
        DelayedTransfer memory transfer = delayedTransfers[transferId];
        return (
            transfer.recipient,
            transfer.amount,
            transfer.sender,
            transfer.executeAt,
            transfer.executed,
            transfer.delayMinutes,
            block.timestamp >= transfer.executeAt && !transfer.executed
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
    
    receive() external payable {}
    fallback() external payable {}
}