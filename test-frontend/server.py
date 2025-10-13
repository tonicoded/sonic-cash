#!/usr/bin/env python3
"""
Simple HTTP server for Sonic Privacy Pool test frontend
Run with: python3 server.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.realpath(__file__)), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"""
🌊 Sonic Privacy Pool - Test Frontend
=====================================
Server running at: http://localhost:{PORT}
Network: Sonic Testnet
Contract: 0x99519DcF977438C51B394fAB88D740A16Cf929B6

📋 Test Instructions:
1. Open http://localhost:{PORT} in your browser
2. Connect MetaMask to Sonic Testnet
3. Test deposit functionality
4. Save your secret note!

Press Ctrl+C to stop the server
            """)
            
            # Auto-open browser
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Start server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Thanks for testing!")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()