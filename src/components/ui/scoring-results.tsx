import { Loader2, Sparkles, Award, AlertCircle } from 'lucide-react';
import { Button } from './Button';

type ScoringResultsProps = {
  isScoring: boolean;
  score: number | null;
  feedback: string;
  error: string | null;
  isRewarded: boolean;
  onRetry: () => void;
};

export function ScoringResults({
  isScoring,
  score,
  feedback,
  error,
  isRewarded,
  onRetry,
}: ScoringResultsProps) {
  if (isScoring) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Analyzing your Diwali photo...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Our AI is evaluating the festive spirit in your photo. This may take a moment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error processing your photo
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                onClick={onRetry}
                className="border border-red-200 bg-white text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (score !== null) {
    const scorePercentage = (score / 10) * 100;
    const isHighScore = score >= 7;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Your Diwali Spirit Score
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  {feedback}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {score}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className={`h-2.5 rounded-full ${
                    isHighScore ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${scorePercentage}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>1 - Minimal</span>
                <span>10 - Amazing!</span>
              </div>
            </div>

            {isRewarded && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Award className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Congratulations! You've earned a reward for your festive spirit! 🎉
                    </p>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                      Your reward has been sent to your connected wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onRetry}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-200"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Try Another Photo
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
