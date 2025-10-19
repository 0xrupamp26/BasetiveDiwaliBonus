'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetwork } from 'wagmi';

type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'error';

export function TransactionStatus({
  hash,
  onConfirmed,
  onError,
}: {
  hash: string;
  onConfirmed?: () => void;
  onError?: (error: Error) => void;
}) {
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const { chain } = useNetwork();
  
  const explorerUrl = chain?.blockExplorers?.default?.url || `https://basescan.org/tx/${hash}`;

  useEffect(() => {
    if (!hash) return;

    const checkTransaction = async () => {
      try {
        setStatus('confirming');
        
        // Wait for transaction to be mined
        const receipt = await provider.waitForTransaction(hash, 1);
        
        if (receipt.status === 1) {
          setStatus('confirmed');
          onConfirmed?.();
        } else {
          throw new Error('Transaction failed');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Transaction failed');
        onError?.(err instanceof Error ? err : new Error('Transaction failed'));
      }
    };

    checkTransaction();
  }, [hash, onConfirmed, onError]);

  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span>Waiting for wallet confirmation...</span>
          </div>
        );
      case 'confirming':
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span>Confirming transaction...</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Transaction confirmed!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>{error || 'Transaction failed'}</span>
          </div>
        );
    }
  };

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="space-y-3">
        {getStatusContent()}
        {hash && (
          <div className="flex items-center justify-between pt-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center"
            >
              View on {chain?.blockExplorers?.default?.name || 'Explorer'}
              <ExternalLink className="ml-1 w-3 h-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(hash)}
              className="text-xs"
            >
              Copy Hash
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
