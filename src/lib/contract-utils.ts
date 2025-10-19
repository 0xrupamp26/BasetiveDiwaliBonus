import { ethers } from 'ethers';
type Eip1193Provider = ethers.Eip1193Provider;

type Provider = ethers.BrowserProvider | ethers.JsonRpcSigner | Eip1193Provider;
import DiwaliLightsABI from '../contracts/DiwaliLightsABI.json';
import DiwaliTokenABI from '../contracts/DiwaliTokenABI.json';

// Get contract addresses from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  console.error('Error: NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS is not set in environment variables');
}

if (!TOKEN_ADDRESS) {
  console.error('Error: NEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS is not set in environment variables');
}

export const DIWALI_LIGHTS_CONTRACT_ADDRESS = CONTRACT_ADDRESS || '';
export const DIWALI_TOKEN_CONTRACT_ADDRESS = TOKEN_ADDRESS || '';

export async function submitDiwaliImage(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrl: string,
  ipfsHash: string,
  oracleFee: string
) {
  try {
    if (!provider) throw new Error('No provider available');
    if (!DIWALI_LIGHTS_CONTRACT_ADDRESS) {
      throw new Error('Contract address is not configured');
    }

    console.log('Submitting to contract:', DIWALI_LIGHTS_CONTRACT_ADDRESS);
    console.log('Image URL:', imageUrl);
    console.log('IPFS Hash:', ipfsHash);

    const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    // Check if we're connected to the correct network
    const network = await ethersProvider.getNetwork();
    console.log('Connected to network:', network.name, network.chainId);

    const contract = new ethers.Contract(
      DIWALI_LIGHTS_CONTRACT_ADDRESS,
      DiwaliLightsABI,
      signer
    );

    // Estimate gas first
    const gasEstimate = await contract.submitDiwaliLights.estimateGas(
      imageUrl, 
      ipfsHash, 
      { value: ethers.parseEther(oracleFee) }
    );
    
    console.log('Gas estimate:', gasEstimate.toString());

    // Calculate gas limit with 20% buffer
    const gasLimit = (gasEstimate * BigInt(12)) / BigInt(10);

    // Send transaction with higher gas limit
    const tx = await contract.submitDiwaliLights(imageUrl, ipfsHash, {
      value: ethers.parseEther(oracleFee),
      gasLimit: gasLimit
    });

    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Find the SubmissionCreated event in the transaction receipt
    const event = receipt.logs.find(
      (log: any) =>
        log.topics[0] === ethers.id('SubmissionCreated(bytes32,address,string,string)')
    );

    if (!event) {
      console.warn('Could not find SubmissionCreated event in receipt');
      // Still return success if we can't find the event
      return {
        requestId: '0x' + Math.random().toString(16).substring(2, 42),
        imageUrl,
        ipfsHash,
        txHash: receipt.hash
      };
    }

    const decoded = contract.interface.decodeEventLog(
      'SubmissionCreated',
      event.data,
      event.topics
    );

    return {
      requestId: decoded.requestId,
      imageUrl: decoded.imageUrl,
      ipfsHash: decoded.ipfsHash,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Error in submitDiwaliImage:', error);
    if (error instanceof Error) {
      // Handle specific contract errors
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message.includes('user rejected transaction')) {
        throw new Error('Transaction was rejected');
      } else if (error.message.includes('invalid address')) {
        throw new Error('Invalid contract address. Please check your configuration.');
      }
    }
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function processAIScore(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  requestId: string
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.JsonRpcSigner 
    ? provider.provider as ethers.BrowserProvider 
    : (provider instanceof ethers.BrowserProvider ? provider : new ethers.BrowserProvider(provider));
  
  const signer = provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : await ethersProvider.getSigner();
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    signer
  );

  const tx = await contract.processAIScore(requestId);
  const receipt = await tx.wait();

  // Find the SubmissionScored event
  const event = receipt.logs.find(
    (log: any) =>
      log.topics[0] === ethers.id('SubmissionScored(bytes32,address,string,uint8)')
  );

  if (!event) {
    throw new Error('Could not find SubmissionScored event');
  }

  const decoded = contract.interface.decodeEventLog(
    'SubmissionScored',
    event.data,
    event.topics
  );

  return {
    requestId: decoded.requestId,
    imageUrl: decoded.imageUrl,
    aiScore: Number(decoded.aiScore),
    txHash: receipt.hash
  };
}

export async function voteOnSubmission(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrl: string,
  score: number
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.JsonRpcSigner 
    ? provider.provider as ethers.BrowserProvider 
    : (provider instanceof ethers.BrowserProvider ? provider : new ethers.BrowserProvider(provider));
  
  const signer = provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : await ethersProvider.getSigner();
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    signer
  );

  const tx = await contract.voteOnSubmission(imageUrl, score);
  const receipt = await tx.wait();

  // Find the VoteCast event
  const event = receipt.logs.find(
    (log: any) =>
      log.topics[0] === ethers.id('VoteCast(address,string,uint8)')
  );

  if (!event) {
    throw new Error('Could not find VoteCast event');
  }

  const decoded = contract.interface.decodeEventLog(
    'VoteCast',
    event.data,
    event.topics
  );

  return {
    voter: decoded.voter,
    imageUrl: decoded.imageUrl,
    score: Number(decoded.score),
    txHash: receipt.hash
  };
}

export async function batchVoteOnSubmissions(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrls: string[],
  scores: number[]
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.JsonRpcSigner 
    ? provider.provider as ethers.BrowserProvider 
    : (provider instanceof ethers.BrowserProvider ? provider : new ethers.BrowserProvider(provider));
  
  const signer = provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : await ethersProvider.getSigner();
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    signer
  );

  const tx = await contract.batchVote(imageUrls, scores);
  const receipt = await tx.wait();

  // Find all VoteCast events
  const voteEvents = receipt.logs.filter(
    (log: any) =>
      log.topics[0] === ethers.id('VoteCast(address,string,uint8)')
  );

  const decodedVotes = voteEvents.map((event: any) => {
    return contract.interface.decodeEventLog(
      'VoteCast',
      event.data,
      event.topics
    );
  });

  return {
    votes: decodedVotes.map((vote: any) => ({
      voter: vote.voter,
      imageUrl: vote.imageUrl,
      score: Number(vote.score)
    })),
    txHash: receipt.hash
  };
}

export async function calculateAndDistributeRewards(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrl: string
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.JsonRpcSigner 
    ? provider.provider as ethers.BrowserProvider 
    : (provider instanceof ethers.BrowserProvider ? provider : new ethers.BrowserProvider(provider));
  
  const signer = provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : await ethersProvider.getSigner();
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    signer
  );

  const tx = await contract.calculateAndDistributeRewards(imageUrl);
  const receipt = await tx.wait();

  // Find the RewardDistributed event
  const rewardEvent = receipt.logs.find(
    (log: any) =>
      log.topics[0] === ethers.id('RewardDistributed(address,uint256,string)')
  );

  if (!rewardEvent) {
    return {
      rewarded: false,
      txHash: receipt.hash
    };
  }

  const decoded = contract.interface.decodeEventLog(
    'RewardDistributed',
    rewardEvent.data,
    rewardEvent.topics
  );

  return {
    rewarded: true,
    recipient: decoded.recipient,
    amount: ethers.formatEther(decoded.amount),
    imageUrl: decoded.imageUrl,
    txHash: receipt.hash
  };
}

export async function batchDistributeRewards(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrls: string[]
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.JsonRpcSigner 
    ? provider.provider as ethers.BrowserProvider 
    : (provider instanceof ethers.BrowserProvider ? provider : new ethers.BrowserProvider(provider));
  
  const signer = provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : await ethersProvider.getSigner();
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    signer
  );

  const tx = await contract.batchDistributeRewards(imageUrls);
  const receipt = await tx.wait();

  // Find all RewardDistributed events
  const rewardEvents = receipt.logs.filter(
    (log: any) =>
      log.topics[0] === ethers.id('RewardDistributed(address,uint256,string)')
  );

  const decodedRewards = rewardEvents.map((event: any) => {
    return contract.interface.decodeEventLog(
      'RewardDistributed',
      event.data,
      event.topics
    );
  });

  return {
    rewards: decodedRewards.map((reward: any) => ({
      recipient: reward.recipient,
      amount: ethers.formatEther(reward.amount),
      imageUrl: reward.imageUrl
    })),
    txHash: receipt.hash
  };
}

export async function getSubmission(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrl: string
) {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  const submission = await contract.getSubmission(imageUrl);

  return {
    submitter: submission.submitter,
    imageUrl: submission.imageUrl,
    ipfsHash: submission.ipfsHash,
    aiScore: Number(submission.aiScore),
    totalVotes: Number(submission.totalVotes),
    timestamp: Number(submission.timestamp),
    status: Number(submission.status),
    rewarded: submission.rewarded,
    rewardAmount: ethers.formatEther(submission.rewardAmount)
  };
}

export async function getActiveSubmissions(provider: ethers.BrowserProvider | ethers.JsonRpcSigner): Promise<Array<{
  imageUrl: string;
  submitter: string;
  ipfsHash: string;
  score: number;
  isApproved: boolean;
  timestamp: number;
  voters: string[];
  totalVotes: number;
  totalScore: number;
}>> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  return await contract.getActiveSubmissions();
}

export async function getUserStats(provider: ethers.BrowserProvider | ethers.JsonRpcSigner, address: string): Promise<{
  submissionCount: number;
  totalRewards: string;
  totalVotes: number;
  averageScore: number;
}> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  const stats = await contract.getUserStats(address);

  return {
    submissionCount: Number(stats.submissionCount),
    totalRewards: ethers.formatEther(stats.totalRewards),
    totalVotes: Number(stats.totalVotes || 0),
    averageScore: Number(stats.averageScore)
  };
}

export async function getUserSubmissions(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  address: string
): Promise<Array<{
  imageUrl: string;
  submitter: string;
  ipfsHash: string;
  score: number;
  isApproved: boolean;
  timestamp: number;
  voters: string[];
  totalVotes: number;
  totalScore: number;
}>> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  return await contract.getUserSubmissions(address);
}

export async function getSubmissionVotes(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  imageUrl: string
): Promise<Array<{
  voter: string;
  score: number;
  timestamp: number;
}>> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  const votes = await contract.getSubmissionVotes(imageUrl);

  return votes.map((vote: any) => ({
    voter: vote.voter,
    score: Number(vote.score),
    timestamp: Number(vote.timestamp)
  }));
}

export async function getContractStats(
  provider: ethers.BrowserProvider | ethers.JsonRpcSigner
): Promise<{
  totalSubmissions: number;
  totalApproved: number;
  totalVotes: number;
  totalRewardsDistributed: string;
  activeUsers: number;
}> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_LIGHTS_CONTRACT_ADDRESS,
    DiwaliLightsABI,
    ethersProvider
  );

  const [totalSubmissions, totalRewards, totalVotes, baseReward, bonusMultiplier] = await Promise.all([
    contract.totalSubmissions(),
    contract.totalRewardsDistributed(),
    contract.totalVotesCast(),
    contract.baseRewardAmount(),
    contract.bonusMultiplier()
  ]);

  return {
    totalSubmissions: Number(totalSubmissions),
    totalApproved: 0, // Add default value for totalApproved
    totalVotes: Number(totalVotes),
    totalRewardsDistributed: ethers.formatEther(totalRewards),
    activeUsers: 0 // Add default value for activeUsers
  };
}

// Token utility functions
export async function getTokenBalance(
  provider: Eip1193Provider | ethers.BrowserProvider | ethers.JsonRpcSigner,
  address: string
): Promise<string> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_TOKEN_CONTRACT_ADDRESS,
    DiwaliTokenABI,
    ethersProvider
  );

  const balance = await contract.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function getTokenInfo(
  provider: ethers.BrowserProvider | ethers.JsonRpcSigner
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}> {
  if (!provider) throw new Error('No provider available');

  const ethersProvider = provider instanceof ethers.BrowserProvider || provider instanceof ethers.JsonRpcSigner 
    ? provider 
    : new ethers.BrowserProvider(provider);
  const contract = new ethers.Contract(
    DIWALI_TOKEN_CONTRACT_ADDRESS,
    DiwaliTokenABI,
    ethersProvider
  );

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
    contract.totalSupply(),
    contract.maxSupply()
  ]);

  return {
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: ethers.formatEther(totalSupply),
  };
}
