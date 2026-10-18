import {
  DashboardMetrics,
  DispensationVaultDetail,
  DonorRecord,
  NgoVaultDetail,
  RewardPoolPoint,
  SaverVaultDetail,
  VaultSummary,
} from "@/lib/types";

const now = Date.now();

export const dashboardMetrics: DashboardMetrics = {
  totalValueLockedUsdc: 24592.5,
  weeklyGrowthPercent: 4.2,
  totalRewardsUsdc: 1240.05,
  activeVaultCount: 12,
};

export const rewardPoolSeries: RewardPoolPoint[] = [
  { month: "Jan", value: 180 },
  { month: "Feb", value: 320 },
  { month: "Mar", value: 250 },
  { month: "Apr", value: 480 },
  { month: "May", value: 530 },
  { month: "Jun", value: 710 },
  { month: "Jul", value: 940 },
];

export const activeVaults: VaultSummary[] = [
  {
    id: "082",
    name: "Time-Lock Alpha",
    type: "saver",
    status: "active",
    lockEndsAt: now + 14 * 24 * 60 * 60 * 1000,
    principalUsdc: 5000,
  },
  {
    id: "221",
    name: "Relief Round 3",
    type: "ngo",
    status: "active",
    lockEndsAt: now + 45 * 24 * 60 * 60 * 1000,
    principalUsdc: 12500,
  },
  {
    id: "401",
    name: "Gov Salary Batch",
    type: "dispensation",
    status: "active",
    lockEndsAt: now + 9 * 24 * 60 * 60 * 1000,
    principalUsdc: 35000,
  },
];

export const saverVaultDetail: SaverVaultDetail = {
  id: "082",
  name: "Personal Vault #082",
  type: "saver",
  status: "active",
  lockEndsAt: now + 42 * 24 * 60 * 60 * 1000,
  principalUsdc: 145000,
  ownerWallet: "7xPqKDhA2jS1VN6s9qWg9qpkHzT2Y9v2mRf8h7gH5QXp",
  accumulatedRewardsUsdc: 3240.5,
  rewardPoolUsdc: 18120.75,
  projectedApy: 8.4,
  penaltyBps: 500,
};

export const ngoVaultDonors: DonorRecord[] = [
  {
    wallet: "BkRw5Y2hT6MnVa9xJQ4Sv1P8sN7eLc3Dk6QSp2Vyb9FR",
    donorName: "Ravi Sharma",
    amountUsdc: 25000,
    timestamp: now - 10 * 24 * 60 * 60 * 1000,
  },
  {
    wallet: "F3nHnM9qU5M8eW7vV4nP4sY8gU8cN2V3sX1F2A5zR8Xp",
    amountUsdc: 30000,
    timestamp: now - 7 * 24 * 60 * 60 * 1000,
  },
  {
    wallet: "9QTv3rpZ8UnQ9zR8nK4cT8pM9fS3cB5hQ2gW6nJ9xY2R",
    donorName: "Priya Patel Foundation",
    amountUsdc: 15000,
    timestamp: now - 3 * 24 * 60 * 60 * 1000,
  },
];

export const ngoVaultDetail: NgoVaultDetail = {
  id: "221",
  name: "Flood Relief - Kerala",
  type: "ngo",
  status: "active",
  lockEndsAt: now + 19 * 24 * 60 * 60 * 1000,
  principalUsdc: 82000,
  organizerWallet: "4CtR3Mbr3gN3r3mK7Q8U8q7qS9T5XtWp2h7J9vYr8cPh",
  description:
    "Community rehabilitation fund for emergency shelter and medical support.",
  targetUsdc: 100000,
  beneficiaries: [
    { wallet: "A9vWt2H6nCVa6zjQ5SYQn4V6sM2eLt7Ek2QSp6Vyb3FR", basisPoints: 4000 },
    { wallet: "E8nHnM6qT4M7eU7vV4nM4sX8gU8cN2V3sX1F2A5zR4Gp", basisPoints: 3500 },
    { wallet: "3TPv3rmZ7TnM8yQ7mN4cS8pL9fR3cA5hQ2fW6mJ9wY8Q", basisPoints: 2500 },
  ],
  donors: ngoVaultDonors,
};

export const dispensationVaultDetail: DispensationVaultDetail = {
  id: "401",
  name: "Gov Salary Batch Q2-2026",
  type: "dispensation",
  status: "active",
  lockEndsAt: now + 30 * 24 * 60 * 60 * 1000,
  principalUsdc: 350000,
  authorityWallet: "HzdQ9YbA1o7T7Gf3Kx4Pp8Lr2M1Vb6Yw3Nn5Rk4Qe2Pt",
  cadence: "monthly",
  releaseAmountUsdc: 1260,
  whitelistCount: 278,
  beneficiaries: [
    { wallet: "G5pQ3YbB1n6R7Hf2Jx3Oo7Kr1L0Ub5Xw2Mm4Qj3Pe1Os", basisPoints: 500 },
    { wallet: "T8rW6VcD4q9S0Ig5Mx6Rr0Ns4M3Wf8Zy5Pp7Tk6Uf4Rv", basisPoints: 500 },
    { wallet: "K2sX9WdE5r0T1Jh6Ny7Ss1Ot5N4Xg9Az6Qq8Ul7Vg5Sw", basisPoints: 500 },
  ],
};
