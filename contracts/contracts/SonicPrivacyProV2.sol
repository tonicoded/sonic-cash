// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicPrivacyProV2
 * @dev Advanced privacy mixer with unique deposit addresses per payment request
 */
contract SonicPrivacyProV2 is ReentrancyGuard, Pausable, Ownable {
    
    // Privacy fee (0.1%)
    uint256 public privacyFeePercent = 10;
    
    // Pool stats
    uint256 public totalTransfers;
    uint256 public totalVolume;
    uint256 public totalFees;
    uint256 public totalPaymentRequests;
    
    // Payment request structure
    struct PaymentRequest {
        address recipient;
        uint256 amount;
        uint256 fee;
        address depositAddress;
        uint256 timestamp;
        bool completed;
        bool exists;
    }
    
    // Mapping from unique deposit address to payment request
    mapping(address => PaymentRequest) public paymentRequests;
    
    // Mapping from request ID to deposit address
    mapping(bytes32 => address) public requestToAddress;
    
    // Events
    event PaymentRequestCreated(
        bytes32 indexed requestId,
        address indexed depositAddress,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event PaymentCompleted(
        bytes32 indexed requestId,
        address indexed depositAddress,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    // Errors
    error InvalidAmount();
    error InvalidRecipient();
    error TransferFailed();
    error PaymentRequestNotFound();
    error PaymentAlreadyCompleted();
    error InsufficientPayment();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a unique payment request with deterministic deposit address
     */
    function createPaymentRequest(
        address recipient,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (bytes32 requestId, address depositAddress) {
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        
        // Generate unique request ID
        requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                amount,
                block.timestamp,
                totalPaymentRequests
            )
        );
        
        // Generate deterministic deposit address from request ID
        depositAddress = address(uint160(uint256(keccak256(
            abi.encodePacked(
                address(this),
                requestId,
                "SONIC_DEPOSIT"
            )
        ))));
        
        uint256 fee = (amount * privacyFeePercent) / 10000;
        
        // Store payment request
        paymentRequests[depositAddress] = PaymentRequest({
            recipient: recipient,
            amount: amount,
            fee: fee,
            depositAddress: depositAddress,
            timestamp: block.timestamp,
            completed: false,
            exists: true
        });
        
        requestToAddress[requestId] = depositAddress;
        totalPaymentRequests++;
        
        emit PaymentRequestCreated(
            requestId,
            depositAddress,
            recipient,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Process payment to a deposit address
     */
    function processPayment(address depositAddress) external payable nonReentrant whenNotPaused {
        PaymentRequest storage request = paymentRequests[depositAddress];
        
        if (!request.exists) revert PaymentRequestNotFound();
        if (request.completed) revert PaymentAlreadyCompleted();
        
        uint256 expectedAmount = request.amount;
        if (msg.value < expectedAmount) revert InsufficientPayment();
        
        // Mark as completed
        request.completed = true;
        
        // Calculate actual amounts
        uint256 fee = request.fee;
        uint256 transferAmount = expectedAmount - fee;
        
        // Update stats
        totalTransfers++;
        totalVolume += expectedAmount;
        totalFees += fee;
        
        // Send funds to recipient
        (bool success, ) = request.recipient.call{value: transferAmount}("");
        if (!success) revert TransferFailed();
        
        // Refund excess payment if any
        if (msg.value > expectedAmount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - expectedAmount}("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit PaymentCompleted(
            keccak256(abi.encodePacked(depositAddress, "REQUEST")),
            depositAddress,
            request.recipient,
            transferAmount,
            fee,
            block.timestamp
        );
    }
    
    /**
     * @dev Check if payment was sent to deposit address (view function for monitoring)
     */
    function checkPaymentStatus(address depositAddress) external view returns (
        bool exists,
        bool completed,
        address recipient,
        uint256 amount,
        uint256 timestamp
    ) {
        PaymentRequest memory request = paymentRequests[depositAddress];
        return (
            request.exists,
            request.completed,
            request.recipient,
            request.amount,
            request.timestamp
        );
    }
    
    /**
     * @dev Get payment request details
     */
    function getPaymentRequest(address depositAddress) external view returns (
        address recipient,
        uint256 amount,
        uint256 fee,
        uint256 timestamp,
        bool completed
    ) {
        PaymentRequest memory request = paymentRequests[depositAddress];
        if (!request.exists) revert PaymentRequestNotFound();
        
        return (
            request.recipient,
            request.amount,
            request.fee,
            request.timestamp,
            request.completed
        );
    }
    
    /**
     * @dev Get enhanced pool stats
     */
    function getPoolStats() external view returns (
        uint256 _totalTransfers,
        uint256 _totalVolume,
        uint256 _contractBalance,
        uint256 _privacyFee,
        uint256 _totalPaymentRequests,
        uint256 _totalFees
    ) {
        return (
            totalTransfers,
            totalVolume,
            address(this).balance,
            privacyFeePercent,
            totalPaymentRequests,
            totalFees
        );
    }
    
    /**
     * @dev Emergency function to process payment if auto-detection fails
     */
    function manualProcessPayment(address depositAddress) external {
        if (address(this).balance < paymentRequests[depositAddress].amount) {
            revert InsufficientPayment();
        }
        
        PaymentRequest storage request = paymentRequests[depositAddress];
        if (!request.exists || request.completed) return;
        
        // Check if this contract received the payment
        if (address(this).balance >= request.amount) {
            request.completed = true;
            
            uint256 transferAmount = request.amount - request.fee;
            totalTransfers++;
            totalVolume += request.amount;
            totalFees += request.fee;
            
            (bool success, ) = request.recipient.call{value: transferAmount}("");
            if (!success) revert TransferFailed();
            
            emit PaymentCompleted(
                keccak256(abi.encodePacked(depositAddress, "MANUAL")),
                depositAddress,
                request.recipient,
                transferAmount,
                request.fee,
                block.timestamp
            );
        }
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
        if (balance == 0) revert InvalidAmount();
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Receive function to handle direct payments
    receive() external payable {
        // Try to find if this is a payment to a known deposit address
        PaymentRequest storage request = paymentRequests[msg.sender];
        if (request.exists && !request.completed && msg.value >= request.amount) {
            // Auto-process the payment
            request.completed = true;
            
            uint256 transferAmount = request.amount - request.fee;
            totalTransfers++;
            totalVolume += request.amount;
            totalFees += request.fee;
            
            (bool success, ) = request.recipient.call{value: transferAmount}("");
            require(success, "Transfer failed");
            
            emit PaymentCompleted(
                keccak256(abi.encodePacked(msg.sender, "AUTO")),
                msg.sender,
                request.recipient,
                transferAmount,
                request.fee,
                block.timestamp
            );
        }
    }
    
    fallback() external payable {
        // Handle any other calls
    }
}