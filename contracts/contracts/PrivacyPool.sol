// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Verifier.sol";
import "./PoseidonHasher.sol";

/**
 * @title PrivacyPool
 * @dev Main contract for anonymous token transfers using ZK-proofs
 * Sonic Privacy Pool - Privacy-focused dApp for anonymous token transfers
 */
contract PrivacyPool is ReentrancyGuard, Pausable, Ownable {
    using PoseidonHasher for bytes32;

    // Fixed denomination for MVP (1 S token)
    uint256 public constant DENOMINATION = 1 ether;
    
    // Merkle tree parameters
    uint32 public constant TREE_LEVELS = 20;
    uint32 public constant MAX_DEPOSIT_COUNT = 1048576; // 2^20
    
    // Verifier contract for ZK-proofs
    Verifier public immutable verifier;
    
    // Merkle tree state
    mapping(bytes32 => bool) public nullifiers;
    mapping(uint32 => bytes32) public commitments;
    uint32 public nextIndex = 0;
    bytes32 public root;
    
    // Events
    event Deposit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
    
    event Withdrawal(
        address to,
        bytes32 nullifier,
        address relayer,
        uint256 fee,
        uint256 timestamp
    );

    // Errors
    error InvalidDeposit();
    error InvalidProof();
    error NullifierUsed();
    error TreeFull();
    error InvalidAmount();

    constructor(address _verifier) Ownable(msg.sender) {
        verifier = Verifier(_verifier);
    }

    /**
     * @dev Deposit tokens and commit to privacy pool
     * @param commitment Poseidon hash commitment for future withdrawal
     */
    function deposit(bytes32 commitment) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        if (msg.value != DENOMINATION) revert InvalidAmount();
        if (nextIndex >= MAX_DEPOSIT_COUNT) revert TreeFull();

        uint32 insertedIndex = nextIndex;
        commitments[insertedIndex] = commitment;
        nextIndex = insertedIndex + 1;

        // Update Merkle root (simplified for MVP - would use incremental tree)
        _updateRoot();

        emit Deposit(commitment, insertedIndex, block.timestamp);
    }

    /**
     * @dev Withdraw tokens using ZK-proof
     * @param proof PLONK proof of valid withdrawal
     * @param merkleRoot Merkle root being proven against
     * @param nullifier Unique nullifier to prevent double-spending
     * @param recipient Address to receive withdrawn funds
     * @param relayer Address of relayer (optional, can be zero)
     * @param fee Fee for relayer (must be <= DENOMINATION)
     */
    function withdraw(
        uint[24] calldata proof, // PLONK proof format
        bytes32 merkleRoot,
        bytes32 nullifier,
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) external nonReentrant whenNotPaused {
        if (fee > DENOMINATION) revert InvalidAmount();
        if (nullifiers[nullifier]) revert NullifierUsed();

        // Verify ZK-proof
        bool isValidProof = verifier.verifyProof(
            [proof[0], proof[1]], // a
            [[proof[2], proof[3]], [proof[4], proof[5]]], // b  
            [proof[6], proof[7]], // c
            [uint256(merkleRoot), uint256(nullifier), uint256(uint160(address(recipient))), fee]
        );
        
        if (!isValidProof) revert InvalidProof();

        // Mark nullifier as used
        nullifiers[nullifier] = true;

        // Transfer funds
        uint256 recipientAmount = DENOMINATION - fee;
        
        if (fee > 0 && relayer != address(0)) {
            relayer.transfer(fee);
        }
        
        recipient.transfer(recipientAmount);

        emit Withdrawal(recipient, nullifier, relayer, fee, block.timestamp);
    }

    /**
     * @dev Update Merkle root (simplified implementation for MVP)
     * In production, use incremental Merkle tree for efficiency
     */
    function _updateRoot() private {
        // This is a simplified version - production should use efficient incremental updates
        bytes32[] memory hashes = new bytes32[](nextIndex);
        
        for (uint32 i = 0; i < nextIndex; i++) {
            hashes[i] = commitments[i];
        }
        
        root = _computeMerkleRoot(hashes);
    }

    /**
     * @dev Compute Merkle root from array of leaves
     */
    function _computeMerkleRoot(bytes32[] memory leaves) 
        private 
        pure 
        returns (bytes32) 
    {
        if (leaves.length == 0) return bytes32(0);
        if (leaves.length == 1) return leaves[0];

        while (leaves.length > 1) {
            bytes32[] memory newLevel = new bytes32[]((leaves.length + 1) / 2);
            
            for (uint256 i = 0; i < newLevel.length; i++) {
                if (2 * i + 1 < leaves.length) {
                    newLevel[i] = PoseidonHasher.poseidon([leaves[2 * i], leaves[2 * i + 1]]);
                } else {
                    newLevel[i] = leaves[2 * i];
                }
            }
            
            leaves = newLevel;
        }
        
        return leaves[0];
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
     * @dev Get current Merkle root
     */
    function getRoot() external view returns (bytes32) {
        return root;
    }

    /**
     * @dev Check if nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier];
    }

    /**
     * @dev Get deposit count
     */
    function getDepositCount() external view returns (uint32) {
        return nextIndex;
    }
}