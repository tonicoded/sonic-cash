require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");

// Load environment variables
require("dotenv").config({ path: "../.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SONIC_TESTNET_RPC = process.env.SONIC_TESTNET_RPC || "https://rpc.testnet.soniclabs.org";
const SONIC_MAINNET_RPC = process.env.SONIC_MAINNET_RPC || "https://rpc.soniclabs.org";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    "sonic-testnet": {
      url: SONIC_TESTNET_RPC,
      chainId: 14601, // Sonic testnet chain ID (updated)
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    "sonic-mainnet": {
      url: SONIC_MAINNET_RPC,
      chainId: 146, // Sonic mainnet chain ID
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
  },
  
  etherscan: {
    apiKey: {
      "sonic-testnet": ETHERSCAN_API_KEY,
      "sonic-mainnet": ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "sonic-testnet",
        chainId: 64165,
        urls: {
          apiURL: "https://api.testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org"
        }
      },
      {
        network: "sonic-mainnet", 
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      }
    ]
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  mocha: {
    timeout: 60000,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};