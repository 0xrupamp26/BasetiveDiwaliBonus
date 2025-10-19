import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { aiScoringService } from '~/lib/ai-service';
import { toast } from '~/components/ui/use-toast';

type ScoringState = {
  isScoring: boolean;
  score: number | null;
  feedback: string;
  error: string | null;
  isRewarded: boolean;
};

export function useDiwaliScoring() {
  const [state, setState] = useState<ScoringState>({
    isScoring: false,
    score: null,
    feedback: '',
    error: null,
    isRewarded: false,
  });

  const { address } = useAccount();

  const scoreImage = useCallback(
    async (imageFile: File) => {
      const eth = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
      const provider = eth ? new ethers.BrowserProvider(eth) : null;

      if (!address || !provider) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to submit a photo.',
          variant: 'destructive',
        });
        return;
      }

      setState({
        isScoring: true,
        score: null,
        feedback: 'Analyzing your Diwali photo...',
        error: null,
        isRewarded: false,
      });

      try {
        const result = await aiScoringService.scoreImage(imageFile, provider);

        setState({
          isScoring: false,
          score: result.score,
          feedback: result.feedback,
          error: null,
          isRewarded: result.score > 5,
        });

        toast({
          title: `Score: ${result.score}/10`,
          description: result.feedback,
          variant: result.score > 5 ? 'default' : 'destructive',
        });

        if (result.score > 5) {
          toast({
            title: '🎉 Reward Sent!',
            description: 'Your reward has been sent to your wallet!',
          });
        }
      } catch (error) {
        console.error('Error scoring image:', error);
        
        setState({
          isScoring: false,
          score: null,
          feedback: '',
          error: error instanceof Error ? error.message : 'Failed to score image',
          isRewarded: false,
        });

        toast({
          title: 'Error',
          description: 'Failed to process your image. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [address]
  );

  const resetScoring = useCallback(() => {
    setState({
      isScoring: false,
      score: null,
      feedback: '',
      error: null,
      isRewarded: false,
    });
  }, []);

  return {
    ...state,
    scoreImage,
    resetScoring,
  };
}
