import * as snarkjs from 'snarkjs'
import { randomBytes } from 'crypto'
import { poseidon } from 'circomlib'

/**
 * Crypto utilities for Sonic Privacy Pool
 * Handles secret generation, commitments, and ZK proof generation
 */

export interface SecretNote {
  secret: string
  nullifierSecret: string
  commitment: string
  recipient: string
}

export interface ProofInputs {
  secret: string
  nullifierSecret: string
  recipient: string
  relayer: string
  fee: number
}

export interface ZKProof {
  proof: any
  publicSignals: {
    root: string
    nullifier: string
    recipient: string
    fee: string
  }
}

/**
 * Generate a random secret note for deposit
 */
export function generateSecretNote(): string {
  const secret = randomBytes(32).toString('hex')
  const nullifierSecret = randomBytes(32).toString('hex')
  
  const noteData = {
    secret,
    nullifierSecret,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  return JSON.stringify(noteData)
}

/**
 * Parse a secret note string back to components
 */
export function parseSecretNote(noteString: string): SecretNote {
  try {
    const noteData = JSON.parse(noteString)
    
    if (!noteData.secret || !noteData.nullifierSecret) {
      throw new Error('Invalid note format')
    }
    
    return {
      secret: noteData.secret,
      nullifierSecret: noteData.nullifierSecret,
      commitment: '', // Will be computed
      recipient: noteData.recipient || ''
    }
  } catch (error) {
    throw new Error('Failed to parse secret note')
  }
}

/**
 * Generate Poseidon hash commitment from secret and nullifier
 */
export async function generateCommitment(secretNote: string, recipient: string): Promise<string> {
  const noteData = parseSecretNote(secretNote)
  
  // Compute commitment = poseidon(secret, nullifierSecret)
  const commitment = poseidon([noteData.secret, noteData.nullifierSecret])
  
  return commitment.toString()
}

/**
 * Generate nullifier hash from secret
 */
export function generateNullifier(secret: string): string {
  // nullifier = poseidon(secret, 1) - using 1 as domain separator
  const nullifier = poseidon([secret, '1'])
  return nullifier.toString()
}

/**
 * Fetch Merkle tree data from contract events
 */
export async function buildMerkleTree(): Promise<{
  root: string
  pathElements: string[]
  pathIndices: number[]
}> {
  // This is a simplified version for MVP
  // Production version should fetch actual deposit events and build tree
  
  // For now, return mock data that matches our test circuit
  return {
    root: '1234567890123456789012345678901234567890123456789012345678901234',
    pathElements: [
      '0',
      '21663839004416932945382355908790599225266501822907911457504978515578255421292',
      '8213775971582852167908982845208982480691707516301849978659234730892239796960',
      '5030775951333130371666652300818059149038084130503677424663060903126030510272',
      ...Array(16).fill('0')
    ],
    pathIndices: [0, 1, 0, 1, ...Array(16).fill(0)]
  }
}

/**
 * Generate zero-knowledge proof for withdrawal
 */
export async function generateZKProof(inputs: ProofInputs): Promise<ZKProof> {
  try {
    // Build Merkle tree proof
    const merkleData = await buildMerkleTree()
    
    // Generate nullifier
    const nullifier = generateNullifier(inputs.secret)
    
    // Prepare circuit inputs
    const circuitInputs = {
      // Private inputs
      secret: inputs.secret,
      nullifier_secret: inputs.nullifierSecret,
      path_elements: merkleData.pathElements,
      path_indices: merkleData.pathIndices,
      
      // Public inputs  
      root: merkleData.root,
      nullifier: nullifier,
      recipient: inputs.recipient,
      fee: inputs.fee.toString()
    }
    
    // Load WASM and proving key from public directory
    const wasmPath = '/withdrawal.wasm'
    const zkeyPath = '/withdrawal.zkey'
    
    // Generate witness
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    )
    
    return {
      proof,
      publicSignals: {
        root: publicSignals[0],
        nullifier: publicSignals[1], 
        recipient: publicSignals[2],
        fee: publicSignals[3]
      }
    }
    
  } catch (error) {
    console.error('Proof generation failed:', error)
    throw new Error('Failed to generate zero-knowledge proof')
  }
}

/**
 * Verify a zero-knowledge proof (client-side verification)
 */
export async function verifyZKProof(proof: any, publicSignals: any): Promise<boolean> {
  try {
    // Load verification key from public directory
    const vkeyResponse = await fetch('/verification_key.json')
    const vkey = await vkeyResponse.json()
    
    // Verify proof
    const verified = await snarkjs.plonk.verify(vkey, publicSignals, proof)
    
    return verified
    
  } catch (error) {
    console.error('Proof verification failed:', error)
    return false
  }
}

/**
 * Convert hex string to field element for circuits
 */
export function hexToField(hex: string): string {
  return BigInt(hex).toString()
}

/**
 * Convert address to field element for circuits  
 */
export function addressToField(address: string): string {
  return BigInt(address).toString()
}

/**
 * Format proof for contract call
 */
export function formatProofForContract(proof: any): number[] {
  // Convert PLONK proof to format expected by Solidity verifier
  // This is a simplified version - production needs proper formatting
  
  const formattedProof = [
    ...proof.a,
    ...proof.b[0],
    ...proof.b[1], 
    ...proof.c,
    ...proof.z,
    ...proof.t1,
    ...proof.t2,
    ...proof.t3,
    ...proof.Wxi,
    ...proof.Wxiw
  ]
  
  return formattedProof.map(x => parseInt(x))
}