import { createConfig, http, WagmiProvider as WagmiProviderBase } from "wagmi";
import { base, degen, mainnet, optimism, unichain, celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { APP_NAME, APP_ICON_URL, APP_URL } from "~/lib/constants";
import * as React from "react";
import { useConnect, useAccount } from "wagmi";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Type for the useCoinbaseWalletAutoConnect hook
interface UseCoinbaseWalletAutoConnectReturn {
  isCoinbaseWallet: boolean;
}

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect(): UseCoinbaseWalletAutoConnectReturn {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = React.useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  React.useEffect(() => {
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      const isInCoinbaseWallet = window.ethereum?.isCoinbaseWallet || 
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser;
      setIsCoinbaseWallet(!!isInCoinbaseWallet);
    };
    
    checkCoinbaseWallet();
    window.addEventListener('ethereum#initialized', checkCoinbaseWallet);
    
    return () => {
      window.removeEventListener('ethereum#initialized', checkCoinbaseWallet);
    };
  }, []);

  React.useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected) {
      connect({ connector: connectors[1] }); // Coinbase Wallet connector
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return { isCoinbaseWallet };
}


export const config = createConfig({
  chains: [base, optimism, mainnet, degen, unichain, celo],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
    [unichain.id]: http(),
    [celo.id]: http(),
  },
  connectors: [
    farcasterFrame(),
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
      preference: 'all',
    }),
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        iconUrl: APP_ICON_URL,
        url: APP_URL,
      },
      // Use the global ethereum provider that we configured
      // The MetaMask connector will use window.ethereum by default
    }),
  ],
});

const queryClient = new QueryClient();

// Wrapper component that provides Coinbase Wallet auto-connection
const CoinbaseWalletAutoConnect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useCoinbaseWalletAutoConnect();
  return <>{children}</>;
};

const WagmiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        <CoinbaseWalletAutoConnect>
          {children}
        </CoinbaseWalletAutoConnect>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
};

export default WagmiProvider;
