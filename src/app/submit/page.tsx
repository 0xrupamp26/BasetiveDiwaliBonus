'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from '~/components/ui/Button';
import { ImageUpload } from '~/components/ui/image-upload';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { submitDiwaliImage, processAIScore, calculateAndDistributeRewards } from '~/lib/contract-utils';
import { uploadToIPFS, getIPFSUrl } from '~/lib/ipfs';

// Define the expected network ID (e.g., 8453 for Base Mainnet)
const EXPECTED_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID 
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) 
  : 8453;

type SubmissionStep = 'upload' | 'submitting' | 'ai-scoring' | 'reward-check' | 'complete' | 'error';

interface SubmissionResult {
  requestId: string;
  imageUrl: string;
  ipfsHash: string;
  score: number;
  rewarded: boolean;
  rewardAmount?: string;
  txHash?: string;
}

export default function SubmitPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>('upload');
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isCheckingReward, setIsCheckingReward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;

  const resetForm = () => {
    setImageFile(null);
    setIpfsHash('');
    setSubmissionStep('upload');
    setSubmissionResult(null);
    setError(null);
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    // Clear any previous IPFS hash when a new file is uploaded
    if (ipfsHash) {
      setIpfsHash('');
    }
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setError('Please select an image to upload');
      return;
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet to submit a photo');
      return;
    }

    if (chainId !== EXPECTED_CHAIN_ID) {
      setError(`Please switch to the correct network (Chain ID: ${EXPECTED_CHAIN_ID})`);
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      setSubmissionStep('submitting');

      // Step 1: Upload to IPFS
      toast.loading('Uploading image to IPFS...');
      let finalIpfsHash = ipfsHash;
      
      if (!finalIpfsHash) {
        try {
          const buffer = await imageFile.arrayBuffer();
          finalIpfsHash = await uploadToIPFS(Buffer.from(buffer));
          setIpfsHash(finalIpfsHash);
          toast.success('Image uploaded to IPFS');
        } catch (ipfsError) {
          console.error('IPFS upload failed:', ipfsError);
          throw new Error('Failed to upload image to IPFS. Please try again.');
        }
      }

      // Step 2: Submit to smart contract
      toast.loading('Submitting to blockchain...');
      setSubmissionStep('ai-scoring');
      
      try {
        const imageUrl = getIPFSUrl(finalIpfsHash);
        const oracleFee = '0.001'; // 0.001 ETH for oracle fee
        
        if (!provider) {
          throw new Error('Ethereum provider not available');
        }

        const result = await submitDiwaliImage(
          provider,
          imageUrl,
          finalIpfsHash,
          oracleFee
        );

        setSubmissionResult({
          requestId: result.requestId,
          imageUrl,
          ipfsHash: finalIpfsHash,
          score: 0,
          rewarded: false,
          txHash: result.txHash
        });

        toast.success('Transaction submitted!', {
          description: `Transaction hash: ${result.txHash.substring(0, 10)}...`
        });

        // Step 3: Process AI score (simulated)
        setIsProcessingAI(true);
        toast.loading('Processing your image with AI...');
        
        try {
          // In a real implementation, this would be handled by the oracle
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (!provider) {
            throw new Error('Ethereum provider not available');
          }

          await processAIScore(provider, result.requestId);
          setIsProcessingAI(false);
          setSubmissionStep('reward-check');
          toast.success('AI processing complete!');

          // Step 4: Check for rewards
          setIsCheckingReward(true);
          toast.loading('Calculating your reward...');
          
          await calculateAndDistributeRewards(provider, imageUrl);
          
          setIsCheckingReward(false);
          setSubmissionStep('complete');

          // Update result with final status
          const finalScore = Math.floor(Math.random() * 5) + 6; // Random score between 6-10
          const rewardAmount = (finalScore * 0.1).toFixed(2); // 0.1 ETH per point
          
          setSubmissionResult(prev => prev ? {
            ...prev,
            score: finalScore,
            rewarded: true,
            rewardAmount
          } : null);

          toast.success('🎉 Submission Complete!', {
            description: `Your Diwali photo scored ${finalScore}/10!`,
          });
          
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          setError(aiError instanceof Error ? aiError.message : 'AI processing failed');
          setSubmissionStep('error');
          toast.error('AI processing failed');
        }
        
      } catch (txError) {
        console.error('Transaction error:', txError);
        setError(txError instanceof Error ? txError.message : 'Transaction failed. Please try again.');
        setSubmissionStep('error');
        toast.error('Transaction failed');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSubmissionStep('error');
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
      setIsProcessingAI(false);
      setIsCheckingReward(false);
    }
  };

  const resetSubmission = () => {
    setImageFile(null);
    setIpfsHash('');
    setSubmissionResult(null);
    setSubmissionStep('upload');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-5 h-5" />;
    if (score >= 6) return <TrendingUp className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Share Your Diwali Magic
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload a photo of your Diwali celebration and earn rewards based on festive spirit!
        </p>
      </div>

      {/* Submission Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[
            { step: 'upload', label: 'Upload Photo', active: submissionStep === 'upload' },
            { step: 'ai-scoring', label: 'AI Scoring', active: ['ai-scoring', 'reward-check', 'complete'].includes(submissionStep) },
            { step: 'reward-check', label: 'Check Rewards', active: ['reward-check', 'complete'].includes(submissionStep) },
            { step: 'complete', label: 'Complete', active: submissionStep === 'complete' },
          ].map((step, index) => (
            <div key={step.step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step.active
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.active && submissionStep !== 'upload' && index > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`ml-2 text-sm ${step.active ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {index < 3 && (
                <div className={`w-8 h-1 mx-2 ${step.active ? 'bg-amber-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
        {submissionStep === 'upload' && (
          <div>
            <ImageUpload onImageUpload={handleImageUpload} disabled={!isConnected} />
            {imageFile && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Submit for AI Scoring
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {submissionStep === 'ai-scoring' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isProcessingAI ? 'AI is analyzing your photo...' : 'Processing your submission...'}
            </h3>
            <p className="text-gray-600">
              Our AI is evaluating the festive spirit and lighting in your Diwali photo.
            </p>
          </div>
        )}

        {submissionStep === 'reward-check' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isCheckingReward ? 'Checking for rewards...' : 'Calculating rewards...'}
            </h3>
            <p className="text-gray-600">
              We're checking if your submission qualifies for rewards based on the AI score.
            </p>
          </div>
        )}

        {submissionStep === 'complete' && submissionResult && (
          <div className="text-center py-8">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${getScoreColor(submissionResult.score)}`}>
              {getScoreIcon(submissionResult.score)}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {submissionResult.rewarded ? '🎉 Congratulations!' : 'Thank you for sharing!'}
            </h3>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">AI Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(submissionResult.score)}`}>
                    {submissionResult.score}/10
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Reward Status</div>
                  <div className={`text-2xl font-bold ${submissionResult.rewarded ? 'text-green-600' : 'text-gray-600'}`}>
                    {submissionResult.rewarded ? `+${submissionResult.rewardAmount} DWL` : 'No reward'}
                  </div>
                </div>
              </div>

              {submissionResult.rewarded && (
                <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  🎁 You've earned {submissionResult.rewardAmount} DWL tokens! Check your wallet.
                </div>
              )}
            </div>

            <Button onClick={resetSubmission} className="border border-gray-300">
              Submit Another Photo
            </Button>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
          📸 Submission Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700 dark:text-amber-300">
          <div>
            <h4 className="font-medium mb-2">✅ What works best:</h4>
            <ul className="space-y-1">
              <li>• Well-lit Diwali decorations</li>
              <li>• Clear photos of diyas and lamps</li>
              <li>• Festive attire and celebrations</li>
              <li>• High contrast and vibrant colors</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">❌ What to avoid:</h4>
            <ul className="space-y-1">
              <li>• Dark or blurry images</li>
              <li>• Non-Diwali related content</li>
              <li>• Copyrighted material</li>
              <li>• Inappropriate content</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 text-xs text-amber-600 dark:text-amber-400">
          📝 By submitting, you agree to share your photo in our public gallery and follow our community guidelines.
        </div>
      </div>
    </div>
  );
}
