'use client'

import { useState } from 'react'
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { motion } from 'framer-motion'
import { 
  ArrowDownIcon, 
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { generateSecretNote, generateCommitment } from '@/lib/crypto'
import { PRIVACY_POOL_ADDRESS, PRIVACY_POOL_ABI } from '@/lib/contracts'

export default function DepositForm() {
  const [amount, setAmount] = useState('1.0')
  const [recipient, setRecipient] = useState('')
  const [secretNote, setSecretNote] = useState<string | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [isGeneratingNote, setIsGeneratingNote] = useState(false)

  const { address } = useAccount()

  const { data, write, isLoading: isWriteLoading } = useContractWrite({
    address: PRIVACY_POOL_ADDRESS,
    abi: PRIVACY_POOL_ABI,
    functionName: 'deposit',
  })

  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      toast.success('Deposit successful! Save your secret note safely.')
    },
    onError() {
      toast.error('Deposit failed. Please try again.')
    }
  })

  const handleDeposit = async () => {
    if (!recipient || !address) {
      toast.error('Please enter a recipient address')
      return
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    try {
      setIsGeneratingNote(true)
      
      // Generate secret note and commitment
      const secret = generateSecretNote()
      const commitment = await generateCommitment(secret, recipient)
      
      setSecretNote(secret)
      
      // Call contract deposit function
      write({
        args: [commitment],
        value: parseEther(amount),
      })
      
    } catch (error) {
      console.error('Deposit error:', error)
      toast.error('Failed to generate commitment')
    } finally {
      setIsGeneratingNote(false)
    }
  }

  const copyNote = () => {
    if (secretNote) {
      navigator.clipboard.writeText(secretNote)
      toast.success('Secret note copied to clipboard')
    }
  }

  const downloadNote = () => {
    if (secretNote) {
      const noteData = {
        secret: secretNote,
        amount: amount,
        recipient: recipient,
        timestamp: new Date().toISOString(),
        network: 'sonic-testnet'
      }
      
      const blob = new Blob([JSON.stringify(noteData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sonic-privacy-note-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Secret note downloaded')
    }
  }

  const isLoading = isWriteLoading || isTransactionLoading || isGeneratingNote

  if (isSuccess && secretNote) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center">
          <ArrowDownIcon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-green-400">
          Deposit Successful!
        </h3>
        
        <p className="text-gray-300">
          Your tokens have been deposited privately. Save your secret note to withdraw later.
        </p>
        
        {/* Secret Note Display */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Your Secret Note</h4>
            <button
              onClick={() => setShowNote(!showNote)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showNote ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm break-all">
            {showNote ? secretNote : '•'.repeat(64)}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={copyNote}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              Copy Note
            </button>
            <button
              onClick={downloadNote}
              className="flex-1 btn-primary"
            >
              Download Note
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 font-semibold mb-2">⚠️ Important</p>
          <p className="text-sm text-gray-300">
            Your secret note is the ONLY way to withdraw your funds. 
            Keep it safe and never share it with anyone.
          </p>
        </div>
        
        <button
          onClick={() => {
            setSecretNote(null)
            setAmount('1.0')
            setRecipient('')
          }}
          className="btn-secondary"
        >
          Make Another Deposit
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Send Privately</h2>
        <p className="text-gray-400">
          Deposit tokens to the privacy pool and receive a secret note for withdrawal
        </p>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount (S)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-primary w-full pr-12"
            placeholder="1.0"
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            S
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Fixed denomination: 1 S for MVP
        </p>
      </div>

      {/* Recipient Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="input-primary w-full"
          placeholder="0x742d35Cc6641C5532c7f2267DAEE7ba2cbb13E92"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Address that will receive the tokens when withdrawn
        </p>
      </div>

      {/* Transaction Info */}
      <div className="glass-card p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Amount:</span>
          <span>{amount} S</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Network Fee:</span>
          <span>~0.001 S</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Privacy Pool Fee:</span>
          <span>0 S</span>
        </div>
        <hr className="border-white/10" />
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>{amount} S</span>
        </div>
      </div>

      {/* Deposit Button */}
      <button
        onClick={handleDeposit}
        disabled={isLoading || !recipient || parseFloat(amount) <= 0}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {isGeneratingNote ? 'Generating Note...' : 'Confirming Transaction...'}
          </>
        ) : (
          <>
            <ArrowDownIcon className="w-5 h-5" />
            Deposit Privately
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400 font-semibold mb-2">ℹ️ How it works</p>
        <p className="text-sm text-gray-300">
          Your deposit generates a cryptographic commitment that proves you own the funds 
          without revealing your identity. The secret note allows you to withdraw to any address later.
        </p>
      </div>
    </div>
  )
}