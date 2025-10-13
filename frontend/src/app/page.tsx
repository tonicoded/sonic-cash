'use client'

import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useBalance } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  EyeSlashIcon, 
  ShieldCheckIcon, 
  BoltIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'

import DepositForm from '@/components/DepositForm'
import WithdrawForm from '@/components/WithdrawForm'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const { address, isConnected } = useAccount()
  
  const { data: balance } = useBalance({
    address,
    enabled: isConnected,
  })

  const features = [
    {
      icon: EyeSlashIcon,
      title: 'Complete Privacy',
      description: 'Anonymous transfers using zero-knowledge proofs'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure by Design',
      description: 'Non-custodial, fully on-chain privacy solution'
    },
    {
      icon: BoltIcon,
      title: 'Sonic Speed',
      description: 'Fast transactions with minimal fees on Sonic'
    }
  ]

  return (
    <div className="min-h-screen privacy-pattern">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Send Privately
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Anonymous token transfers on Sonic blockchain using zero-knowledge proofs. 
            No servers, no middlemen, just pure privacy.
          </p>
          
          {/* Connection Status */}
          <div className="mb-16">
            {isConnected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 max-w-md mx-auto"
              >
                <div className="text-sm text-gray-400 mb-2">Connected Wallet</div>
                <div className="font-mono text-white mb-2">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <div className="text-lg font-semibold text-sonic-500">
                  {balance?.formatted ? `${parseFloat(balance.formatted).toFixed(4)} S` : '0.0000 S'}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-gray-400">Connect your wallet to start using Sonic Privacy Pool</p>
                <ConnectKitButton />
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Main Interface */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {/* Tab Navigation */}
            <div className="glass-card p-2 mb-8">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'deposit'
                      ? 'bg-privacy-accent text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Send Privately
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'withdraw'
                      ? 'bg-privacy-accent text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Withdraw
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="glass-card p-8">
              {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
            </div>
          </motion.div>
        )}
      </section>
      
      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy-First Architecture
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Built on Sonic's fast, low-cost blockchain with cutting-edge zero-knowledge technology
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sonic-500 to-privacy-accent rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Simple, secure, and completely anonymous
          </p>
        </motion.div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {[
              {
                step: 1,
                title: 'Deposit Tokens',
                description: 'Send your S tokens to the privacy pool and receive a secret note'
              },
              {
                step: 2,
                title: 'Generate Proof',
                description: 'Your browser creates a zero-knowledge proof without revealing your identity'
              },
              {
                step: 3,
                title: 'Withdraw Anonymously',
                description: 'Use your secret note to withdraw to any address with complete privacy'
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex items-center gap-8"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-sonic-500 to-privacy-accent rounded-full flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <div className="flex-grow glass-card p-6">
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-300">{item.description}</p>
                </div>
                {index < 2 && (
                  <ArrowRightIcon className="w-8 h-8 text-privacy-accent flex-shrink-0 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
      
      {/* Scroll Indicator */}
      {!isConnected && (
        <div className="scroll-indicator" />
      )}
    </div>
  )
}