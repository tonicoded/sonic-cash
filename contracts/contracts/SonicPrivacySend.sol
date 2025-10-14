// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicPrivacySend
 * @dev Simple anonymous send contract - money goes through privacy pool
 * User sends amount to recipient, but transaction is completely anonymous
 */
contract SonicPrivacySend is ReentrancyGuard, Pausable, Ownable {
    
    // Privacy fee (0.1% to cover gas and maintain anonymity)
    uint256 public privacyFeePercent = 10; // 0.1%
    uint256 public constant MAX_FEE_PERCENT = 100; // 1% max
    
    // Minimum delay for anonymity (in blocks)
    uint256 public minDelay = 1; // 1 block minimum
    uint256 public maxDelay = 50; // 50 blocks maximum
    
    // Pending anonymous transfers
    struct PendingTransfer {
        address recipient;
        uint256 amount;
        uint256 executeBlock;
        bool executed;
    }
    
    mapping(bytes32 => PendingTransfer) public pendingTransfers;
    mapping(address => uint256) public totalSent;
    mapping(address => uint256) public totalReceived;
    
    // Pool stats
    uint256 public totalTransfers;
    uint256 public totalVolume;
    
    // Events
    event AnonymousTransferInitiated(
        bytes32 indexed transferId,
        uint256 amount,
        uint256 executeBlock,
        uint256 timestamp
    );
    
    event AnonymousTransferExecuted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event PrivacyFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // Errors
    error InvalidAmount();
    error InvalidRecipient();
    error TransferNotReady();
    error TransferAlreadyExecuted();
    error TransferNotFound();
    error InvalidFee();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Send money anonymously through privacy pool
     * @param recipient The address to receive the funds
     * @param delayBlocks Number of blocks to delay (for anonymity)
     */
    function sendAnonymously(
        address payable recipient,
        uint256 delayBlocks
    ) external payable nonReentrant whenNotPaused {
        
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (delayBlocks < minDelay || delayBlocks > maxDelay) {
            delayBlocks = minDelay + (block.number % (maxDelay - minDelay));
        }
        
        // Calculate fee
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        
        // Generate unique transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                msg.value,
                block.timestamp,
                block.number,
                totalTransfers
            )
        );
        
        // Calculate execution block
        uint256 executeBlock = block.number + delayBlocks;
        
        // Store pending transfer
        pendingTransfers[transferId] = PendingTransfer({
            recipient: recipient,
            amount: transferAmount,
            executeBlock: executeBlock,
            executed: false
        });
        
        // Update stats
        totalSent[msg.sender] += msg.value;
        totalTransfers++;
        totalVolume += msg.value;
        
        emit AnonymousTransferInitiated(
            transferId,
            transferAmount,
            executeBlock,
            block.timestamp
        );
    }
    
    /**
     * @dev Execute a pending anonymous transfer
     * @param transferId The ID of the transfer to execute
     */
    function executeTransfer(bytes32 transferId) external nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        
        if (transfer.amount == 0) revert TransferNotFound();
        if (transfer.executed) revert TransferAlreadyExecuted();
        if (block.number < transfer.executeBlock) revert TransferNotReady();
        
        // Mark as executed
        transfer.executed = true;
        
        // Update recipient stats
        totalReceived[transfer.recipient] += transfer.amount;
        
        // Send funds to recipient
        transfer.recipient.call{value: transfer.amount}("");
        
        emit AnonymousTransferExecuted(
            transferId,
            transfer.recipient,
            transfer.amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Send immediately (less privacy but faster)
     * @param recipient The address to receive the funds
     */
    function sendImmediately(
        address payable recipient
    ) external payable nonReentrant whenNotPaused {
        
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        
        // Calculate fee
        uint256 fee = (msg.value * privacyFeePercent) / 10000;
        uint256 transferAmount = msg.value - fee;
        
        // Update stats
        totalSent[msg.sender] += msg.value;
        totalReceived[recipient] += transferAmount;
        totalTransfers++;
        totalVolume += msg.value;
        
        // Generate transfer ID for event
        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                msg.value,
                block.timestamp,
                "immediate"
            )
        );
        
        // Send immediately through contract (breaks direct link)
        recipient.call{value: transferAmount}("");
        
        emit AnonymousTransferExecuted(
            transferId,
            recipient,
            transferAmount,
            block.timestamp
        );
    }
    
    /**
     * @dev Batch execute multiple transfers for better anonymity
     */
    function batchExecuteTransfers(bytes32[] calldata transferIds) external nonReentrant {
        for (uint i = 0; i < transferIds.length; i++) {
            bytes32 transferId = transferIds[i];
            PendingTransfer storage transfer = pendingTransfers[transferId];
            
            if (transfer.amount > 0 && 
                !transfer.executed && 
                block.number >= transfer.executeBlock) {
                
                transfer.executed = true;
                totalReceived[transfer.recipient] += transfer.amount;
                
                transfer.recipient.call{value: transfer.amount}("");
                
                emit AnonymousTransferExecuted(
                    transferId,
                    transfer.recipient,
                    transfer.amount,
                    block.timestamp
                );
            }
        }
    }
    
    /**
     * @dev Get pending transfer info
     */
    function getPendingTransfer(bytes32 transferId) external view returns (
        address recipient,
        uint256 amount,
        uint256 executeBlock,
        bool executed,
        bool ready
    ) {
        PendingTransfer memory transfer = pendingTransfers[transferId];
        return (
            transfer.recipient,
            transfer.amount,
            transfer.executeBlock,
            transfer.executed,
            block.number >= transfer.executeBlock && !transfer.executed
        );
    }
    
    /**
     * @dev Get privacy pool stats
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
     * @dev Update privacy fee (only owner)
     */
    function updatePrivacyFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        
        uint256 oldFee = privacyFeePercent;
        privacyFeePercent = newFeePercent;
        
        emit PrivacyFeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @dev Update delay parameters
     */
    function updateDelayParams(uint256 _minDelay, uint256 _maxDelay) external onlyOwner {
        require(_minDelay > 0 && _maxDelay > _minDelay, "Invalid delays");
        minDelay = _minDelay;
        maxDelay = _maxDelay;
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
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
     * @dev Receive function to accept payments
     */
    receive() external payable {}
}