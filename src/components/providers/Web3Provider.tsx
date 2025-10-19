'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, base } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// wagmi v2 config with viem transports
const config = createConfig({
  chains: [base, mainnet],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [mainnet.id]: http(),
  },
  ssr: true,
});

// Create a React Query client
const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
