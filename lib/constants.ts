import { clusterApiUrl } from "@solana/web3.js";
import { SolanaCluster, VaultOption } from "@/lib/types";

export function resolveCluster(value: string | undefined): SolanaCluster {
  if (value === "mainnet-beta" || value === "testnet") {
    return value;
  }

  return "devnet";
}

export const APP_NAME = "LUMINOUS";
export const PENALTY_BPS = 500;
export const BPS_DENOMINATOR = 10_000;
export const DEFAULT_AAVE_APY = 5.2;

export const SOLANA_CLUSTERS: Array<{
  id: SolanaCluster;
  label: string;
  badge: string;
}> = [
  { id: "devnet", label: "Devnet", badge: "Safe sandbox" },
  { id: "testnet", label: "Testnet", badge: "Validator test" },
  { id: "mainnet-beta", label: "Mainnet", badge: "Live funds" },
];

export const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_NETWORK || resolveCluster(undefined);
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(resolveCluster(SOLANA_CLUSTER));

export const USDC_MINT_BY_CLUSTER: Record<SolanaCluster, string> = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

export const USDC_MINT = USDC_MINT_BY_CLUSTER[resolveCluster(SOLANA_CLUSTER)];
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "ReplaceWithAnchorProgramPublicKey";
export const VAULT_TREASURY_WALLET =
  process.env.NEXT_PUBLIC_VAULT_TREASURY_WALLET ??
  process.env.NEXT_PUBLIC_ESCROW_TREASURY_WALLET ??
  "";

export const PROTOCOL_RULES = [
  "USDC-only vault deposits and payouts for fiat-equivalent stability.",
  "Claim-based pull distribution after unlock (no push fan-out).",
  "Strict 5% early exit slash redistributed to loyal lockers in the same pool.",
];

export const VAULT_OPTIONS: VaultOption[] = [
  {
    type: "saver",
    title: "Saver's Vault",
    description:
      "Personal time-locked savings with enforced financial discipline. Early exit pays a 5% penalty that rewards committed savers.",
    bullets: [
      "Single wallet owner — your personal piggy bank",
      "5% emergency exit penalty rewards disciplined savers",
      "Claim principal + reward pool share after unlock",
      "Optional Aave USDC yield integration",
    ],
  },
  {
    type: "ngo",
    title: "NGO / Welfare Vault",
    description:
      "Transparent, trustless crowdfunding for NGOs, charities, and community relief. Every donor and beneficiary is publicly verifiable on-chain.",
    bullets: [
      "Public USDC donations with full donor transparency",
      "Beneficiaries claim directly — no middlemen",
      "On-chain audit trail for every fund movement",
      "Admin cannot steal, change allocations, or unlock early",
    ],
  },
  {
    type: "welfare",
    title: "Community Welfare Vault",
    description:
      "Authority-funded equitable distribution vault with full transparency. Designed for community welfare, relief, and social programs.",
    bullets: [
      "Whitelisted recipient wallets with equal splits",
      "Zero penalty — funds release on schedule",
      "Donor list and beneficiary data fully public",
      "Blockchain-verified fairness for every distribution",
    ],
  },
  {
    type: "dispensation",
    title: "Dispensation Vault",
    description:
      "Automated payment infrastructure for governments and enterprises. Lock funds, set schedules, and let recipients claim transparently.",
    bullets: [
      "Authority deposits — workers/citizens claim after unlock",
      "Modify recipients before lock expires",
      "No emergency withdraw — guaranteed fund availability",
      "Fully transparent payroll and welfare distribution",
    ],
  },
];
