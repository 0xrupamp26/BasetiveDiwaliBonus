import { useState, useEffect } from 'react';
import { useWaitForTransaction } from 'wagmi';

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

export function useTransactionStatus(hash?: `0x${string}` | null) {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const { isLoading, isSuccess, isError, error: txError } = useWaitForTransaction({
    hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (!hash) {
      setStatus('idle');
      return;
    }

    if (isLoading) {
      setStatus('confirming');
    } else if (isSuccess) {
      setStatus('confirmed');
    } else if (isError) {
      setStatus('error');
      setError(txError || new Error('Transaction failed'));
    }
  }, [hash, isLoading, isSuccess, isError, txError]);

  const reset = () => {
    setStatus('idle');
    setError(null);
  };

  return {
    status,
    error,
    isLoading: status === 'confirming' || status === 'pending',
    isConfirmed: status === 'confirmed',
    isError: status === 'error',
    reset,
  };
}
