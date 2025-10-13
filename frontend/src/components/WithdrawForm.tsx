'use client'

import { useState } from 'react'
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  ArrowUpIcon, 
  DocumentArrowUpIcon,
  CpuChipIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { generateZKProof, parseSecretNote } from '@/lib/crypto'
import { PRIVACY_POOL_ADDRESS, PRIVACY_POOL_ABI } from '@/lib/contracts'

export default function WithdrawForm() {
  const [secretNote, setSecretNote] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [relayerAddress, setRelayerAddress] = useState('')
  const [relayerFee, setRelayerFee] = useState('0')
  const [isGeneratingProof, setIsGeneratingProof] = useState(false)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [currentProof, setCurrentProof] = useState<any>(null)

  const { address } = useAccount()

  const { data, write, isLoading: isWriteLoading } = useContractWrite({
    address: PRIVACY_POOL_ADDRESS,
    abi: PRIVACY_POOL_ABI,
    functionName: 'withdraw',
  })

  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      toast.success('Withdrawal successful!')
      setSecretNote('')
      setRecipientAddress('')
      setCurrentProof(null)
      setProofGenerated(false)
    },
    onError() {
      toast.error('Withdrawal failed. Please try again.')
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const noteData = JSON.parse(content)
          
          if (noteData.secret) {
            setSecretNote(noteData.secret)
            setRecipientAddress(noteData.recipient || '')
            toast.success('Secret note loaded from file')
          } else {
            toast.error('Invalid note file format')
          }
        } catch (error) {
          toast.error('Failed to read note file')
        }
      }
      reader.readAsText(file)
    }
  }

  const generateProof = async () => {
    if (!secretNote || !recipientAddress) {
      toast.error('Please provide secret note and recipient address')
      return
    }

    try {
      setIsGeneratingProof(true)
      toast.loading('Generating zero-knowledge proof...', { duration: 8000 })

      // Parse secret note and generate proof
      const noteData = parseSecretNote(secretNote)
      const proof = await generateZKProof({
        secret: noteData.secret,
        nullifierSecret: noteData.nullifierSecret,
        recipient: recipientAddress,
        relayer: relayerAddress || '0x0000000000000000000000000000000000000000',
        fee: parseFloat(relayerFee) || 0
      })

      setCurrentProof(proof)
      setProofGenerated(true)
      toast.success('Proof generated successfully!')

    } catch (error) {
      console.error('Proof generation failed:', error)
      toast.error('Failed to generate proof. Please check your secret note.')
    } finally {
      setIsGeneratingProof(false)
    }
  }

  const handleWithdraw = async () => {
    if (!currentProof) {
      toast.error('Please generate proof first')
      return
    }

    try {
      // Call contract withdraw function
      write({
        args: [
          currentProof.proof,
          currentProof.publicSignals.root,
          currentProof.publicSignals.nullifier,
          recipientAddress,
          relayerAddress || '0x0000000000000000000000000000000000000000',
          parseFloat(relayerFee) || 0
        ]
      })

    } catch (error) {
      console.error('Withdraw error:', error)
      toast.error('Withdrawal failed')
    }
  }

  const isLoading = isWriteLoading || isTransactionLoading || isGeneratingProof

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center">
          <ArrowUpIcon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-green-400">
          Withdrawal Successful!
        </h3>
        
        <p className="text-gray-300">
          Your tokens have been sent anonymously to the recipient address.
        </p>
        
        <button
          onClick={() => {
            setSecretNote('')
            setRecipientAddress('')
            setCurrentProof(null)
            setProofGenerated(false)
          }}
          className="btn-secondary"
        >
          Make Another Withdrawal
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Withdraw Privately</h2>
        <p className="text-gray-400">
          Use your secret note to withdraw tokens to any address
        </p>
      </div>

      {/* Secret Note Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Secret Note
        </label>
        <div className="space-y-3">
          <textarea
            value={secretNote}
            onChange={(e) => setSecretNote(e.target.value)}
            className="input-primary w-full h-24 resize-none"
            placeholder="Paste your secret note here..."
            disabled={isLoading}
          />
          
          {/* File Upload */}
          <div className="flex items-center gap-3">
            <label className="btn-secondary cursor-pointer flex items-center gap-2">
              <DocumentArrowUpIcon className="w-4 h-4" />
              Load from File
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            <span className="text-xs text-gray-400">
              Or upload your downloaded note file
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="input-primary w-full"
          placeholder="0x742d35Cc6641C5532c7f2267DAEE7ba2cbb13E92"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Address that will receive the withdrawn tokens
        </p>
      </div>

      {/* Advanced Options */}
      <details className="glass-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-300 mb-4">
          Advanced Options (Optional)
        </summary>
        
        <div className="space-y-4">
          {/* Relayer Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relayer Address (Optional)
            </label>
            <input
              type="text"
              value={relayerAddress}
              onChange={(e) => setRelayerAddress(e.target.value)}
              className="input-primary w-full"
              placeholder="0x0000000000000000000000000000000000000000"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Use a relayer to pay gas fees for complete anonymity
            </p>
          </div>

          {/* Relayer Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relayer Fee (S)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.1"
              value={relayerFee}
              onChange={(e) => setRelayerFee(e.target.value)}
              className="input-primary w-full"
              placeholder="0.01"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Fee paid to relayer (max 0.1 S)
            </p>
          </div>
        </div>
      </details>

      {/* Generate Proof Button */}
      {!proofGenerated ? (
        <button
          onClick={generateProof}
          disabled={isLoading || !secretNote || !recipientAddress}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGeneratingProof ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Proof...
            </>
          ) : (
            <>
              <CpuChipIcon className="w-5 h-5" />
              Generate Proof
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Proof Status */}
          <div className="glass-card p-4 bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-semibold">Proof Generated</span>
            </div>
            <p className="text-sm text-gray-300">
              Zero-knowledge proof is ready. You can now withdraw your tokens.
            </p>
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={isWriteLoading || isTransactionLoading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isWriteLoading || isTransactionLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming Withdrawal...
              </>
            ) : (
              <>
                <ArrowUpIcon className="w-5 h-5" />
                Withdraw Tokens
              </>
            )}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400 font-semibold mb-2">🔒 Privacy Notice</p>
        <p className="text-sm text-gray-300">
          Proof generation happens entirely in your browser. Your secret never leaves your device, 
          ensuring complete privacy and anonymity.
        </p>
      </div>
    </div>
  )
}