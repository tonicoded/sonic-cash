/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  
  // Enable WASM support for snarkjs
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify'),
      url: require.resolve('url'),
    };
    
    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SONIC_TESTNET_RPC: process.env.NEXT_PUBLIC_SONIC_TESTNET_RPC,
    NEXT_PUBLIC_SONIC_MAINNET_RPC: process.env.NEXT_PUBLIC_SONIC_MAINNET_RPC,
    NEXT_PUBLIC_PRIVACY_POOL_ADDRESS: process.env.NEXT_PUBLIC_PRIVACY_POOL_ADDRESS,
  },
};

module.exports = nextConfig;