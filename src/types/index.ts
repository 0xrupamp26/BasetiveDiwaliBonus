export interface Submission {
  id: number;
  submitter: string;
  cid: string;
  score: number;
  isApproved: boolean;
  timestamp: number;
}

export interface TransactionState {
  status: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';
  error: Error | null;
  isLoading: boolean;
  isConfirmed: boolean;
  isError: boolean;
  reset: () => void;
}
