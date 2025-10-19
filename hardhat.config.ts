import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-mocha';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./hardhat-cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    localhost: {
      type: 'http',
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    base_sepolia: {
      type: 'http',
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
      gasMultiplier: 1.2,
      timeout: 120000
    },
    base_mainnet: {
      type: 'http',
      url: process.env.MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
      gasMultiplier: 1.2,
      timeout: 120000
    }
  },
  etherscan: {
    apiKey: {
      base_sepolia: process.env.BASESCAN_API_KEY || "",
      base_mainnet: process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base_mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || ""
  },
  mocha: {
    timeout: 120000
  }
};

export default config;
