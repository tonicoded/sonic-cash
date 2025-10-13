'use client'

import { WagmiProvider as BaseWagmiProvider, createConfig, http } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

// Sonic network configurations
const sonicTestnet = {
  id: 14601,
  name: 'Sonic Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://testnet.sonicscan.org' },
  },
  testnet: true,
} as const

const sonicMainnet = {
  id: 146,
  name: 'Sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['https://rpc.soniclabs.org'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
} as const

// Create wagmi config with ConnectKit
const config = getDefaultConfig({
  appName: 'Sonic Privacy Pool',
  appDescription: 'Anonymous token transfers on Sonic blockchain',
  appUrl: 'https://privacy.sonic.xyz',
  appIcon: '/favicon.ico',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [sonicTestnet, sonicMainnet],
  transports: {
    [sonicTestnet.id]: http('https://rpc.testnet.soniclabs.com'),
    [sonicMainnet.id]: http('https://rpc.soniclabs.org'),
  },
})

interface WagmiProviderProps {
  children: React.ReactNode
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <BaseWagmiProvider config={config}>
      <ConnectKitProvider 
        theme="midnight"
        mode="dark"
        customTheme={{
          '--ck-accent-color': '#6366f1',
          '--ck-accent-text-color': '#ffffff',
          '--ck-bg-primary': '#0a0a0b',
          '--ck-bg-secondary': '#1a1a1b',
          '--ck-border-radius': '12px',
        }}
        options={{
          initialChainId: sonicTestnet.id,
          disclaimer: (
            <div className="text-xs text-gray-400 text-center p-4">
              <p>
                This is experimental software. Use at your own risk.
              </p>
              <p className="mt-1">
                By connecting, you agree to the{' '}
                <a 
                  href="/terms" 
                  className="text-privacy-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy" 
                  className="text-privacy-accent hover:underline"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          ),
        }}
      >
        {children}
      </ConnectKitProvider>
    </BaseWagmiProvider>
  )
}