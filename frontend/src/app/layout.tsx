import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WagmiProvider } from './providers/WagmiProvider'
import { ToastProvider } from './providers/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sonic Privacy Pool',
  description: 'Anonymous token transfers on Sonic blockchain using ZK-proofs',
  keywords: ['privacy', 'blockchain', 'sonic', 'zk-proof', 'anonymous'],
  authors: [{ name: 'Sonic Privacy Pool Team' }],
  openGraph: {
    title: 'Sonic Privacy Pool',
    description: 'Send tokens privately on Sonic blockchain',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sonic Privacy Pool',
    description: 'Anonymous token transfers on Sonic blockchain',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-privacy-dark text-white min-h-screen`}>
        <WagmiProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gradient-to-br from-privacy-dark via-privacy-light to-privacy-dark">
              {children}
            </div>
          </ToastProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}