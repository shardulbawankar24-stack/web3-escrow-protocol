export type VaultType = "saver" | "ngo" | "welfare" | "dispensation";
export type VaultStatus = "active" | "unlocked" | "claimed" | "closed";
export type VaultCadence = "monthly" | "weekly";
export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";
export type UserPurpose = "saving_money" | "welfare_fund" | "salary_dispensation";
export type TransactionKind =
  | "create_vault"
  | "deposit"
  | "withdraw"
  | "claim"
  | "beneficiary_release"
  | "aave_supply"

export type TransactionStatus = "confirmed" | "pending" | "simulated";

export interface BeneficiaryShare {
  wallet: string;
  basisPoints: number;
}

export interface DonorRecord {
  wallet: string;
  donorName?: string;
  amountUsdc: number;
  timestamp: number;
}

export interface VaultSummary {
  id: string;
  name: string;
  type: VaultType;
  status: VaultStatus;
  lockEndsAt: number;
  principalUsdc: number;
}

export interface VaultRecord extends VaultSummary {
  strategyLabel: string;
  ownerWallet: string;
  accumulatedRewardsUsdc: number;
  rewardPoolUsdc: number;
  projectedApy: number;
  useAaveYield?: boolean;
  aaveLockDays?: number;
  aaveStatus?: "not_enabled" | "queued" | "supplied" | "withdrawable";
  targetUsdc?: number;
  beneficiaries?: BeneficiaryShare[];
  whitelistCount?: number;
  releaseAmountUsdc?: number;
  cadence?: VaultCadence;
  description?: string;
  donors?: DonorRecord[];
  creationSignature?: string;
  explorerUrl?: string;
}

export interface RewardPoolPoint {
  month: string;
  value: number;
}

export interface DashboardMetrics {
  totalValueLockedUsdc: number;
  weeklyGrowthPercent: number;
  totalRewardsUsdc: number;
  activeVaultCount: number;
}

export interface CreateVaultInput {
  name: string;
  type: VaultType;
  amountUsdc: number;
  durationDays: number;
  beneficiaries?: BeneficiaryShare[];
  ownerWallet?: string;
  useAaveYield?: boolean;
  aaveLockDays?: number;
  description?: string;
  cadence?: VaultCadence;
  releaseAmountUsdc?: number;
  creatorProfileId?: string;
  funding?: VaultFundingReceipt;
}

export interface TransactionResult {
  id: string;
  netAmountUsdc: number;
  penaltyUsdc: number;
  signature?: string;
  explorerUrl?: string;
  status?: TransactionStatus;
}

export interface VaultFundingReceipt {
  amountUsdc: number;
  cluster: SolanaCluster;
  payerWallet: string;
  treasuryWallet?: string;
  signature: string;
  explorerUrl: string;
  status: TransactionStatus;
}

export interface TransparencyLogRecord {
  id: string;
  vaultId: string;
  kind: TransactionKind;
  status: TransactionStatus;
  cluster: SolanaCluster;
  signature?: string;
  explorerUrl?: string;
  amountUsdc: number;
  netAmountUsdc: number;
  penaltyUsdc: number;
  fromWallet?: string;
  toWallet?: string;
  memo: string;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string;
  email?: string;
  organizationName?: string;
  purpose: UserPurpose;
  purposeDetails?: string;
  signedMessage: string;
  signature: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfileInput {
  displayName: string;
  email?: string;
  organizationName?: string;
  purpose: UserPurpose;
  purposeDetails?: string;
}

export interface SaverVaultDetail extends VaultSummary {
  ownerWallet: string;
  accumulatedRewardsUsdc: number;
  rewardPoolUsdc: number;
  projectedApy: number;
  penaltyBps: number;
}

export interface NgoVaultDetail extends VaultSummary {
  organizerWallet: string;
  description: string;
  targetUsdc: number;
  beneficiaries: BeneficiaryShare[];
  donors: DonorRecord[];
}

export interface DispensationVaultDetail extends VaultSummary {
  authorityWallet: string;
  cadence: "monthly" | "weekly";
  releaseAmountUsdc: number;
  whitelistCount: number;
  beneficiaries: BeneficiaryShare[];
}

export interface VaultOption {
  type: VaultType;
  title: string;
  description: string;
  bullets: string[];
}
