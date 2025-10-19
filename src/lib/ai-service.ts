import { ethers } from 'ethers';

export type ScoreResponse = {
  score: number;
  feedback: string;
  requestId?: string;
};

export class AIScoringService {
  private static instance: AIScoringService;
  private apiUrl: string;
  private apiKey: string;

  private constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_AI_ORACLE_API_KEY || '';
  }

  public static getInstance(): AIScoringService {
    if (!AIScoringService.instance) {
      AIScoringService.instance = new AIScoringService();
    }
    return AIScoringService.instance;
  }

  private async uploadToIPFS(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEB3_STORAGE_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to IPFS');
    }

    const data = await response.json();
    return `ipfs://${data.cid}`;
  }

  public async scoreImage(
    imageFile: File,
    provider: ethers.BrowserProvider
  ): Promise<ScoreResponse> {
    try {
      // 1. Upload image to IPFS
      const imageUrl = await this.uploadToIPFS(imageFile);
      
      // 2. Get the oracle fee
      const oracleFee = await this.getOracleFee(provider);
      
      // 3. Submit to smart contract
      const { requestId } = await this.submitToContract(
        provider,
        imageUrl,
        oracleFee
      );
      
      // 4. Poll for the score
      return await this.pollForScore(provider, requestId);
    } catch (error) {
      console.error('Error scoring image:', error);
      throw new Error('Failed to score image. Please try again.');
    }
  }

  private async getOracleFee(provider: ethers.BrowserProvider): Promise<string> {
    // In a real implementation, this would call the oracle contract
    // For now, return a default value
    return '0.01';
  }

  private async submitToContract(
    provider: ethers.BrowserProvider,
    imageUrl: string,
    oracleFee: string
  ) {
    const { submitDiwaliImage } = await import('./contract-utils');
    return await submitDiwaliImage(provider, imageUrl, oracleFee);
  }

  private async pollForScore(
    provider: ethers.BrowserProvider,
    requestId: string,
    maxAttempts = 30,
    interval = 2000
  ): Promise<ScoreResponse> {
    const { checkScoreAndReward, getSubmission } = await import('./contract-utils');
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkScore = async () => {
        try {
          attempts++;
          
          // Try to get the score from the contract
          const result = await checkScoreAndReward(provider, requestId);
          
          if (result) {
            resolve({
              score: result.score,
              feedback: this.getScoreFeedback(result.score),
              requestId
            });
            return;
          }
          
          // If we've reached max attempts, give up
          if (attempts >= maxAttempts) {
            reject(new Error('Timeout waiting for score'));
            return;
          }
          
          // Otherwise, try again after the interval
          setTimeout(checkScore, interval);
        } catch (error) {
          // If the score isn't ready yet, we'll get a revert
          if (error.message.includes('No response from oracle')) {
            if (attempts >= maxAttempts) {
              reject(new Error('Timeout waiting for score'));
              return;
            }
            setTimeout(checkScore, interval);
          } else {
            reject(error);
          }
        }
      };
      
      // Start polling
      checkScore();
    });
  }

  private getScoreFeedback(score: number): string {
    if (score >= 9) {
      return 'Amazing Diwali spirit! Your celebration is absolutely stunning with brilliant lights and decorations!';
    } else if (score >= 7) {
      return 'Great job! Your Diwali decorations are beautiful and festive.';
    } else if (score >= 5) {
      return 'Nice effort! You\'ve captured the essence of Diwali.';
    } else if (score >= 3) {
      return 'Good start! Consider adding more lights and decorations to enhance the Diwali spirit.';
    } else {
      return 'We see your submission, but it needs more Diwali elements. Try again with more lights and festive decorations!';
    }
  }
}

export const aiScoringService = AIScoringService.getInstance();
