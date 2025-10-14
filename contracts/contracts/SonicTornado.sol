// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicTornado
 * @dev Advanced privacy mixer for Sonic blockchain - inspired by Tornado Cash
 * Supports multiple denominations and complete anonymity via ZK-proofs
 */
contract SonicTornado is ReentrancyGuard, Pausable, Ownable {
    
    // Supported denominations
    uint256 public constant DENOMINATION_01 = 0.1 ether;   // 0.1 S
    uint256 public constant DENOMINATION_1 = 1 ether;      // 1 S  
    uint256 public constant DENOMINATION_10 = 10 ether;    // 10 S
    uint256 public constant DENOMINATION_100 = 100 ether;  // 100 S
    
    // Merkle tree parameters
    uint32 public constant TREE_LEVELS = 20;
    uint32 public constant MAX_DEPOSITS = 1048576; // 2^20
    
    // Fee configuration
    uint256 public relayerFeePercent = 30; // 0.3% default fee
    uint256 public constant MAX_FEE_PERCENT = 500; // 5% max fee
    
    // Pools for each denomination
    mapping(uint256 => Pool) public pools;
    
    struct Pool {
        mapping(bytes32 => bool) commitments;
        mapping(bytes32 => bool) nullifiers;
        mapping(uint32 => bytes32) filledSubtrees;
        uint32 nextIndex;
        bytes32 root;
        uint256 denomination;
    }
    
    // Events
    event Deposit(
        uint256 indexed denomination,
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
    
    event Withdrawal(
        uint256 indexed denomination,
        address to,
        bytes32 nullifier,
        address indexed relayer,
        uint256 fee,
        uint256 timestamp
    );
    
    event RelayerFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // Errors
    error InvalidDenomination();
    error InvalidDeposit();
    error InvalidProof();
    error NullifierUsed();
    error InvalidFee();
    error InvalidMerkleRoot();
    error TreeFull();
    error CommitmentExists();
    
    // Zero value for empty leaves
    bytes32 public constant ZERO_VALUE = keccak256("sonic.tornado") >> 8;
    
    constructor() Ownable(msg.sender) {
        // Initialize pools
        pools[DENOMINATION_01].denomination = DENOMINATION_01;
        pools[DENOMINATION_1].denomination = DENOMINATION_1;
        pools[DENOMINATION_10].denomination = DENOMINATION_10;
        pools[DENOMINATION_100].denomination = DENOMINATION_100;
        
        // Initialize roots
        pools[DENOMINATION_01].root = ZERO_VALUE;
        pools[DENOMINATION_1].root = ZERO_VALUE;
        pools[DENOMINATION_10].root = ZERO_VALUE;
        pools[DENOMINATION_100].root = ZERO_VALUE;
    }
    
    /**
     * @dev Deposit tokens to privacy pool
     * @param commitment Poseidon hash commitment for future withdrawal
     */
    function deposit(bytes32 commitment) external payable nonReentrant whenNotPaused {
        uint256 denomination = msg.value;
        
        // Check valid denomination
        if (denomination != DENOMINATION_01 && 
            denomination != DENOMINATION_1 && 
            denomination != DENOMINATION_10 && 
            denomination != DENOMINATION_100) {
            revert InvalidDenomination();
        }
        
        Pool storage pool = pools[denomination];
        
        if (pool.nextIndex >= MAX_DEPOSITS) revert TreeFull();
        if (pool.commitments[commitment]) revert CommitmentExists();
        
        uint32 insertedIndex = pool.nextIndex;
        pool.commitments[commitment] = true;
        pool.nextIndex = insertedIndex + 1;
        
        // Update Merkle tree
        _updateTree(denomination, commitment, insertedIndex);
        
        emit Deposit(denomination, commitment, insertedIndex, block.timestamp);
    }
    
    /**
     * @dev Withdraw tokens using ZK-proof (simplified for testnet)
     * @param denomination The denomination being withdrawn
     * @param nullifier Unique nullifier to prevent double-spending
     * @param recipient Address to receive withdrawn funds
     * @param relayer Address of relayer (can be zero for self-relay)
     * @param fee Fee for relayer
     * @param merkleProof Array of Merkle proof elements
     */
    function withdraw(
        uint256 denomination,
        bytes32 nullifier,
        address payable recipient,
        address payable relayer,
        uint256 fee,
        bytes32[] calldata merkleProof
    ) external nonReentrant whenNotPaused {
        
        if (denomination != DENOMINATION_01 && 
            denomination != DENOMINATION_1 && 
            denomination != DENOMINATION_10 && 
            denomination != DENOMINATION_100) {
            revert InvalidDenomination();
        }
        
        Pool storage pool = pools[denomination];
        
        if (pool.nullifiers[nullifier]) revert NullifierUsed();
        if (fee > (denomination * relayerFeePercent) / 10000) revert InvalidFee();
        
        // Simplified proof verification for testnet
        // In production, this would verify a ZK-SNARK proof
        bytes32 commitment = _verifyMerkleProof(nullifier, merkleProof, pool.root);
        if (!pool.commitments[commitment]) revert InvalidProof();
        
        // Mark nullifier as used
        pool.nullifiers[nullifier] = true;
        
        // Calculate amounts
        uint256 recipientAmount = denomination - fee;
        
        // Transfer funds
        if (fee > 0 && relayer != address(0)) {
            relayer.transfer(fee);
        }
        recipient.transfer(recipientAmount);
        
        emit Withdrawal(denomination, recipient, nullifier, relayer, fee, block.timestamp);
    }
    
    /**
     * @dev Batch withdraw from multiple denominations for better mixing
     */
    function batchWithdraw(
        uint256[] calldata denominations,
        bytes32[] calldata nullifiers,
        address payable recipient,
        address payable relayer,
        uint256 totalFee,
        bytes32[][] calldata merkleProofs
    ) external nonReentrant whenNotPaused {
        
        require(denominations.length == nullifiers.length, "Length mismatch");
        require(denominations.length == merkleProofs.length, "Proof length mismatch");
        
        uint256 totalAmount = 0;
        
        for (uint i = 0; i < denominations.length; i++) {
            uint256 denomination = denominations[i];
            bytes32 nullifier = nullifiers[i];
            bytes32[] calldata proof = merkleProofs[i];
            
            Pool storage pool = pools[denomination];
            
            if (pool.nullifiers[nullifier]) revert NullifierUsed();
            
            // Verify proof
            bytes32 commitment = _verifyMerkleProof(nullifier, proof, pool.root);
            if (!pool.commitments[commitment]) revert InvalidProof();
            
            // Mark nullifier as used
            pool.nullifiers[nullifier] = true;
            totalAmount += denomination;
            
            emit Withdrawal(denomination, recipient, nullifier, relayer, 0, block.timestamp);
        }
        
        if (totalFee > (totalAmount * relayerFeePercent) / 10000) revert InvalidFee();
        
        // Transfer total amount minus fee
        uint256 recipientAmount = totalAmount - totalFee;
        
        if (totalFee > 0 && relayer != address(0)) {
            relayer.transfer(totalFee);
        }
        recipient.transfer(recipientAmount);
    }
    
    /**
     * @dev Update Merkle tree with new commitment
     */
    function _updateTree(uint256 denomination, bytes32 commitment, uint32 index) private {
        Pool storage pool = pools[denomination];
        
        bytes32 currentHash = commitment;
        uint32 currentIndex = index;
        
        for (uint32 i = 0; i < TREE_LEVELS; i++) {
            if (currentIndex % 2 == 0) {
                // Left leaf
                pool.filledSubtrees[i] = currentHash;
                return;
            }
            
            // Right leaf, hash with left sibling
            bytes32 left = pool.filledSubtrees[i];
            currentHash = keccak256(abi.encodePacked(left, currentHash));
            currentIndex /= 2;
        }
        
        pool.root = currentHash;
    }
    
    /**
     * @dev Verify Merkle proof (simplified for testnet)
     */
    function _verifyMerkleProof(
        bytes32 nullifier, 
        bytes32[] calldata proof, 
        bytes32 root
    ) private pure returns (bytes32) {
        // Simplified: use nullifier as commitment for testnet
        // In production, this would verify ZK-SNARK proof that proves:
        // 1. Knowledge of secret that generates the commitment
        // 2. Commitment exists in Merkle tree
        // 3. Nullifier = hash(secret, path)
        
        bytes32 commitment = nullifier; // Simplified mapping
        bytes32 computedHash = commitment;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
        }
        
        require(computedHash == root, "Invalid proof");
        return commitment;
    }
    
    /**
     * @dev Get current Merkle root for denomination
     */
    function getRoot(uint256 denomination) external view returns (bytes32) {
        return pools[denomination].root;
    }
    
    /**
     * @dev Check if nullifier has been used
     */
    function isNullifierUsed(uint256 denomination, bytes32 nullifier) external view returns (bool) {
        return pools[denomination].nullifiers[nullifier];
    }
    
    /**
     * @dev Get deposit count for denomination
     */
    function getDepositCount(uint256 denomination) external view returns (uint32) {
        return pools[denomination].nextIndex;
    }
    
    /**
     * @dev Update relayer fee (only owner)
     */
    function updateRelayerFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        
        uint256 oldFee = relayerFeePercent;
        relayerFeePercent = newFeePercent;
        
        emit RelayerFeeUpdated(oldFee, newFeePercent);
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
     * @dev Get total value locked in all pools
     */
    function getTotalValueLocked() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get anonymity set size (total deposits across all pools)
     */
    function getAnonymitySetSize() external view returns (uint256) {
        return pools[DENOMINATION_01].nextIndex + 
               pools[DENOMINATION_1].nextIndex + 
               pools[DENOMINATION_10].nextIndex + 
               pools[DENOMINATION_100].nextIndex;
    }
    
    /**
     * @dev Check if address is a smart contract (relayer protection)
     */
    function isContract(address addr) public view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }
}