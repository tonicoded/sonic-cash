export default function Footer() {
  return (
    <footer className="container mx-auto px-4 py-8 border-t border-white/10">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-sonic-500 to-privacy-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">SP</span>
          </div>
          <span className="font-semibold">Sonic Privacy Pool</span>
        </div>
        
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Anonymous token transfers on Sonic blockchain. Built with zero-knowledge proofs for complete privacy.
        </p>
        
        <div className="flex justify-center space-x-6 text-sm">
          <a 
            href="/docs" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Documentation
          </a>
          <a 
            href="/terms" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Terms
          </a>
          <a 
            href="/privacy" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Privacy
          </a>
          <a 
            href="https://github.com/sonic-privacy-pool" 
            className="text-gray-400 hover:text-white transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        
        <div className="text-xs text-gray-500">
          © 2024 Sonic Privacy Pool. Open source and non-custodial.
        </div>
      </div>
    </footer>
  )
}