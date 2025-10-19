'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { Button } from '~/components/ui/Button';
import { Loader2, Wallet } from 'lucide-react';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isConnected && address) {
    const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <Button 
        onClick={() => disconnect()}
        className="border border-border bg-transparent hover:bg-secondary text-foreground"
      >
        {formattedAddress}
      </Button>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <Button
        disabled={pending || connectors.length === 0}
        onClick={async () => {
          try {
            setPending(true);
            const eth: any = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
            // Prefer Coinbase in Coinbase wallet, otherwise MetaMask, else first ready
            const preferCoinbase = eth?.isCoinbaseWallet;
            const preferMetaMask = eth?.isMetaMask;
            let target = connectors.find((c) => preferCoinbase && c.id.toLowerCase().includes('coinbase'))
              || connectors.find((c) => preferMetaMask && c.id.toLowerCase().includes('meta'))
              || connectors.find((c) => c.ready)
              || connectors[0];

            await connectAsync({ connector: target });

            // Optional: signature to establish session
            const now = new Date().toISOString();
            const message = `Bestive Diwali login\nTime: ${now}`;
            try { await signMessageAsync({ message }); } catch {}
            // Navigate to submit page after successful connect
            router.push('/submit');
          } finally {
            setPending(false);
          }
        }}
        className="bg-yellow-500 hover:bg-yellow-600 text-white"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {pending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
}
