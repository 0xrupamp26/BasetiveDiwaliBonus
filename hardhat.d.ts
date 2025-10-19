import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-mocha';

import 'hardhat/types/config';

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    gasReporter?: {
      enabled?: boolean;
      currency?: string;
      coinmarketcap?: string;
    };
    mocha?: {
      timeout?: number;
    };
  }
}
