export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface VoterRecord {
  voterAddress: string;
  optionId: number;
  timestamp: number;
  txHash: string;
  rewardAmount: number; // in USDC
  badgeMinted?: string;
}

export interface Poll {
  id: string;
  onChainId: number;
  creator: string;
  title: string;
  description: string;
  category: 'Web3' | 'DAO' | 'Feedback' | 'Social' | 'Ecosystem';
  options: PollOption[];
  rewardPoolTotal: number; // total USDC deposited
  rewardPerVote: number; // USDC per voter
  maxParticipants: number;
  claimedParticipants: number;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  voters: VoterRecord[]; // addresses mapped
  hasNFTBadge: boolean;
  nftBadgeName?: string;
  txHashCreate: string;
  creatorSignature?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isArcNetwork: boolean;
  usdcBalance: string;
  nativeBalance: string;
  isConnecting: boolean;
  providerType: 'injected' | 'none';
  authSignature?: string;
}

export interface TransactionHistory {
  id: string;
  type: 'CREATE_POLL' | 'VOTE_REWARD' | 'FAUCET' | 'SWITCH_NETWORK' | 'DEPOSIT_VAULT' | 'CANCEL_POLL';
  title: string;
  amountUSDC?: number;
  txHash: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  blockNumber: number;
}

export type Language = 'pt' | 'en';
