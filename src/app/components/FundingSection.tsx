'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '~/components/ui/Button';
import { toast } from '~/components/ui/use-toast';
import { Loader2, Plus, TrendingUp, Users, Coins, DollarSign } from 'lucide-react';
import { getContractStats, getTokenBalance, getTokenInfo } from '~/lib/contract-utils';
import { CONTRACT_CONSTANTS } from '~/lib/constants';

interface ContractStats {
  totalSubmissions: number;
  totalRewardsDistributed: string;
  totalVotesCast: number;
  baseRewardAmount: string;
  bonusMultiplier: number;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
}

export function FundingSection() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      setLoading(true);

      const [contractStats, tokenBalance, tokenDetails] = await Promise.all([
        getContractStats(window.ethereum),
        getTokenBalance(window.ethereum, process.env.NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS || ''),
        getTokenInfo(window.ethereum)
      ]);

      setStats(contractStats);
      setContractBalance(tokenBalance);
      setTokenInfo(tokenDetails);
    } catch (error) {
      console.error('Failed to load contract data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract statistics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundContract = async () => {
    if (!isConnected) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to fund the contract.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setFunding(true);
      // TODO: Implement funding functionality
      // This would involve calling contract deposit functions

      toast({
        title: 'Funding Successful',
        description: 'Thank you for contributing to the Diwali celebration!',
      });

      // Refresh data
      await loadContractData();
    } catch (error) {
      console.error('Funding failed:', error);
      toast({
        title: 'Funding Failed',
        description: 'Failed to fund the contract. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-2" />
          <span>Loading contract statistics...</span>
        </div>
      </div>
    );
  }

  if (!stats || !tokenInfo) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <div className="text-center text-gray-500">
          Unable to load contract data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Support the Celebration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help fund the Diwali rewards and keep the festive spirit alive!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Submissions</p>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{stats.totalSubmissions}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Rewards Distributed</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.totalRewardsDistributed} DWL</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Coins className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Community Votes</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.totalVotesCast}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Contract Balance</p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{contractBalance} DWL</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Funding Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Fund the Reward Pool
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contribute tokens to support Diwali celebrations and reward participants.
            </p>
          </div>
          <Button
            onClick={handleFundContract}
            disabled={funding || !isConnected}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {funding ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Funding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Fund Contract
              </>
            )}
          </Button>
        </div>

        {/* Reward Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-gray-600">4-5</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Base Tier</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Standard reward</p>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {stats.baseRewardAmount} DWL
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-amber-600">6-7</span>
              </div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Medium Tier</h4>
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">Enhanced reward</p>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {Number(stats.baseRewardAmount) * 1.5} DWL
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-green-600">8-10</span>
              </div>
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">High Tier</h4>
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">Bonus reward</p>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {Number(stats.baseRewardAmount) * stats.bonusMultiplier} DWL
              </div>
            </div>
          </div>
        </div>

        {/* Token Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Token Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{tokenInfo.name}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Symbol</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{tokenInfo.symbol}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Decimals</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{tokenInfo.decimals}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Max Supply</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{tokenInfo.maxSupply}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-3">Keep the Diwali Spirit Alive!</h3>
        <p className="mb-6 opacity-90">
          Your contributions help reward participants and maintain the festive celebration.
          Every donation counts towards making Diwali brighter for everyone!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleFundContract}
            disabled={funding || !isConnected}
            className="bg-white text-amber-600 hover:bg-gray-100"
          >
            {funding ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Funding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Fund the Contract
              </>
            )}
          </Button>
          {!isConnected && (
            <p className="text-sm opacity-75">
              Connect your wallet to contribute to the reward pool
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
