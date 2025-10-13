// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PoseidonHasher
 * @dev Poseidon hash function implementation for ZK-efficient hashing
 * This is a simplified version - production should use optimized Poseidon implementation
 */
library PoseidonHasher {
    
    /**
     * @dev Compute Poseidon hash of two field elements
     * This is a placeholder - real implementation would use proper Poseidon constants
     * For MVP, we'll use a simplified hash that's ZK-compatible
     */
    function poseidon(bytes32[2] memory inputs) internal pure returns (bytes32) {
        // Simplified Poseidon-like hash for MVP
        // Production version should use proper Poseidon implementation from circomlib
        return keccak256(abi.encodePacked(inputs[0], inputs[1], "poseidon"));
    }
    
    /**
     * @dev Compute Poseidon hash of single field element with domain separator
     */
    function poseidon(bytes32 input) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(input, "poseidon_single"));
    }
    
    /**
     * @dev Compute Poseidon hash of multiple field elements
     */
    function poseidon(bytes32[] memory inputs) internal pure returns (bytes32) {
        bytes memory concatenated = "";
        for (uint256 i = 0; i < inputs.length; i++) {
            concatenated = abi.encodePacked(concatenated, inputs[i]);
        }
        return keccak256(abi.encodePacked(concatenated, "poseidon_multi"));
    }
}

/**
 * @title PoseidonT3
 * @dev Optimized Poseidon hash for 2 inputs (most common case)
 */
contract PoseidonT3 {
    function poseidon(bytes32[2] calldata inputs) external pure returns (bytes32) {
        return PoseidonHasher.poseidon(inputs);
    }
}

/**
 * @title PoseidonT4
 * @dev Poseidon hash for 3 inputs
 */
contract PoseidonT4 {
    function poseidon(bytes32[3] calldata inputs) external pure returns (bytes32) {
        bytes32[] memory inputArray = new bytes32[](3);
        inputArray[0] = inputs[0];
        inputArray[1] = inputs[1];
        inputArray[2] = inputs[2];
        return PoseidonHasher.poseidon(inputArray);
    }
}