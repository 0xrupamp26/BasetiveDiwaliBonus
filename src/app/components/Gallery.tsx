'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Loader2, Star } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { useAccount } from 'wagmi';
import { toast } from '~/components/ui/use-toast';
import { getActiveSubmissions, getSubmission, getSubmissionVotes, voteOnSubmission } from '~/lib/contract-utils';
import { getIPFSUrl } from '~/lib/ipfs';

interface Submission {
  submitter: string;
  imageUrl: string;
  ipfsHash: string;
  aiScore: number;
  totalVotes: number;
  timestamp: number;
  status: number;
  rewarded: boolean;
  rewardAmount: string;
}

interface Vote {
  voter: string;
  score: number;
  timestamp: number;
}

export function Gallery() {
  const [submissions, setSubmissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const activeSubmissions = await getActiveSubmissions(window.ethereum);
      setSubmissions(activeSubmissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gallery. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (imageUrl: string, score: number) => {
    if (!isConnected) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to vote.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoting(imageUrl);
      await voteOnSubmission(window.ethereum, imageUrl, score);
      toast({
        title: 'Vote Recorded',
        description: `You voted ${score}/10 for this Diwali photo!`,
      });
      // Refresh submissions to update vote counts
      loadSubmissions();
    } catch (error) {
      console.error('Voting failed:', error);
      toast({
        title: 'Vote Failed',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-600">Loading Diwali gallery...</span>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <Star className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No submissions yet</h3>
        <p className="text-gray-600">Be the first to share your Diwali celebration!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Diwali Gallery
        </h2>
        <p className="text-gray-600">
          Vote on the brightest Diwali celebrations and help spread the festive cheer!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map(async (imageUrl) => {
          // We need to load each submission individually since we only have URLs
          try {
            const submission = await getSubmission(window.ethereum, imageUrl);
            const votes = await getSubmissionVotes(window.ethereum, imageUrl);

            return (
              <div key={imageUrl} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <img
                    src={getIPFSUrl(submission.ipfsHash)}
                    alt="Diwali celebration"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
                    Score: {submission.aiScore}/10
                  </div>
                  {submission.rewarded && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-sm">
                      ✨ Rewarded
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      By {formatAddress(submission.submitter)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(submission.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{submission.totalVotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{votes.length}</span>
                      </div>
                    </div>
                  </div>

                  {isConnected && (
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleVote(imageUrl, score)}
                          disabled={voting === imageUrl}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                            voting === imageUrl
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      className="flex items-center space-x-1 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Cheer</span>
                    </Button>
                    {submission.rewarded && (
                      <div className="text-sm text-amber-600 font-semibold">
                        {submission.rewardAmount} DWL
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          } catch (error) {
            console.error(`Failed to load submission ${imageUrl}:`, error);
            return null;
          }
        })}
      </div>
    </div>
  );
}
