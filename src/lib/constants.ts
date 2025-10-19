export const APP_URL = process.env.NEXT_PUBLIC_URL!;
export const APP_NAME = process.env.NEXT_PUBLIC_FRAME_NAME || 'BasetiveDiwaliBonus';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || 'Capture the magic of Diwali, share your brightest moments, and earn crypto rewards for your festive spirit!';
export const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY;
export const APP_TAGS = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');
export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = "#f7f7f7";
export const APP_BUTTON_TEXT = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT;
export const APP_WEBHOOK_URL = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;
export const USE_WALLET = process.env.NEXT_PUBLIC_USE_WALLET === 'true';

// Blockchain Configuration
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
export const BLOCK_EXPLORER_URL = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://sepolia.basescan.org';

// Smart Contract Addresses
export const DIWALI_LIGHTS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS || '';
export const REWARD_TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REWARD_TOKEN_CONTRACT_ADDRESS || '';

// AI Oracle Configuration
export const AI_ORACLE_URL = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:3001/api/ai-score';
export const AI_ORACLE_API_KEY = process.env.NEXT_PUBLIC_AI_ORACLE_API_KEY || '';

// Rate Limiting
export const RATE_LIMIT_WINDOW = parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT_WINDOW || '86400000'); // 24 hours
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT_MAX_REQUESTS || '1');

// IPFS Configuration
export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
export const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';

// Social Features
export const ENABLE_COMMENTS = process.env.NEXT_PUBLIC_ENABLE_COMMENTS === 'true';
export const ENABLE_LIKES = process.env.NEXT_PUBLIC_ENABLE_LIKES === 'true';
export const ENABLE_SEND_CHEER = process.env.NEXT_PUBLIC_ENABLE_SEND_CHEER === 'true';

// Admin Configuration
export const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '';

// Wallet Configuration
export const SUPPORTED_WALLETS = process.env.NEXT_PUBLIC_SUPPORTED_WALLETS ?
  JSON.parse(process.env.NEXT_PUBLIC_SUPPORTED_WALLETS) : ['metamask', 'coinbase', 'walletconnect'];

// Contract Constants
export const CONTRACT_CONSTANTS = {
  BASE_REWARD_AMOUNT: '1000000000000000000', // 1 token (18 decimals)
  BONUS_MULTIPLIER: 2,
  COOLDOWN_PERIOD: 24 * 60 * 60 * 1000, // 24 hours in ms
  VOTING_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  MIN_SCORE_THRESHOLD: 6,
  MAX_SUBMISSIONS_PER_USER: 5,
  MAX_TOTAL_SUBMISSIONS: 10000,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MAX_IMAGE_SIZE_MB: 2,
  MAX_IMAGE_WIDTH: 800,
  MAX_IMAGE_HEIGHT: 600,
  IMAGE_QUALITY: 0.8,
  GALLERY_ITEMS_PER_PAGE: 20,
} as const;

// Social Media Links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/basetivediwalibonus',
  DISCORD: 'https://discord.gg/basetivediwalibonus',
  GITHUB: 'https://github.com/basetive/basetive-diwali-bonus',
} as const;
