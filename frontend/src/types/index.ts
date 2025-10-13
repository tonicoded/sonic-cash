export interface DepositEvent {
  commitment: string
  leafIndex: number
  timestamp: number
  blockNumber: number
  transactionHash: string
}

export interface WithdrawalEvent {
  to: string
  nullifier: string
  relayer: string
  fee: string
  timestamp: number
  blockNumber: number
  transactionHash: string
}

export interface MerkleTreeNode {
  hash: string
  left?: MerkleTreeNode
  right?: MerkleTreeNode
}

export interface MerkleProof {
  root: string
  pathElements: string[]
  pathIndices: number[]
  leaf: string
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error'
  hash?: string
  error?: string
}

export interface PrivacyPoolStats {
  totalDeposits: number
  totalWithdrawals: number
  totalVolume: string
  activeDeposits: number
}