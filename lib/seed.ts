import { RewardPoolPoint, VaultRecord } from "@/lib/types";

const now = Date.now();

export const seededVaults: VaultRecord[] = [
  {
    id: "082",
    name: "Personal Savings 2026",
    type: "saver",
    status: "active",
    strategyLabel: "High-Yield Lock",
    lockEndsAt: now + 42 * 24 * 60 * 60 * 1000,
    principalUsdc: 145000,
    ownerWallet: "7xPqKDhA2jS1VN6s9qWg9qpkHzT2Y9v2mRf8h7gH5QXp",
    accumulatedRewardsUsdc: 3240.5,
    rewardPoolUsdc: 18120.75,
    projectedApy: 8.4,
    useAaveYield: true,
    aaveLockDays: 120,
    aaveStatus: "queued",
    description: "Long-term personal savings for laptop and startup capital.",
  },
  {
    id: "221",
    name: "Flood Relief Kerala",
    type: "ngo",
    status: "active",
    strategyLabel: "Milestone Release",
    lockEndsAt: now + 45 * 24 * 60 * 60 * 1000,
    principalUsdc: 82000,
    ownerWallet: "4CtR3Mbr3gN3r3mK7Q8U8q7qS9T5XtWp2h7J9vYr8cPh",
    accumulatedRewardsUsdc: 0,
    rewardPoolUsdc: 0,
    projectedApy: 0,
    targetUsdc: 100000,
    description:
      "Community rehabilitation fund for emergency shelter and medical support after the 2026 Kerala floods.",
    beneficiaries: [
      {
        wallet: "A9vWt2H6nCVa6zjQ5SYQn4V6sM2eLt7Ek2QSp6Vyb3FR",
        basisPoints: 4000,
      },
      {
        wallet: "E8nHnM6qT4M7eU7vV4nM4sX8gU8cN2V3sX1F2A5zR4Gp",
        basisPoints: 3500,
      },
      {
        wallet: "3TPv3rmZ7TnM8yQ7mN4cS8pL9fR3cA5hQ2fW6mJ9wY8Q",
        basisPoints: 2500,
      },
    ],
    donors: [
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
      {
        wallet: "H7dQ4YbC2p8U7Gg4Lx5Qq9Ls3N2Vc7Yw4Op6Rk5Se3Qt",
        amountUsdc: 12000,
        timestamp: now - 1 * 24 * 60 * 60 * 1000,
      },
    ],
  },
  {
    id: "009",
    name: "Community Welfare Batch A",
    type: "welfare",
    status: "active",
    strategyLabel: "Transparent Welfare Split",
    lockEndsAt: now + 14 * 24 * 60 * 60 * 1000,
    principalUsdc: 5000,
    ownerWallet: "HzdQ9YbA1o7T7Gf3Kx4Pp8Lr2M1Vb6Yw3Nn5Rk4Qe2Pt",
    accumulatedRewardsUsdc: 0,
    rewardPoolUsdc: 0,
    projectedApy: 0,
    description:
      "Community support fund distributing equally to verified local families for essential supplies.",
    beneficiaries: [
      {
        wallet: "Dtp7Z8U6wKk1X8R6rL4p3M2uQ9cH5dSy7Fn3Vo9n2rRE",
        basisPoints: 5000,
      },
      {
        wallet: "9NnyT1Q4Ee5pZ9fG2xVr7Ls8Bw3Hc6Fj4Ab6TtQk2xYm",
        basisPoints: 5000,
      },
    ],
    donors: [
      {
        wallet: "HzdQ9YbA1o7T7Gf3Kx4Pp8Lr2M1Vb6Yw3Nn5Rk4Qe2Pt",
        donorName: "Community Welfare Board",
        amountUsdc: 5000,
        timestamp: now - 5 * 24 * 60 * 60 * 1000,
      },
    ],
    whitelistCount: 2,
    releaseAmountUsdc: 2500,
    cadence: "weekly",
  },
  {
    id: "401",
    name: "Gov Salary Batch Q2-2026",
    type: "dispensation",
    status: "active",
    strategyLabel: "Automated Payroll",
    lockEndsAt: now + 30 * 24 * 60 * 60 * 1000,
    principalUsdc: 350000,
    ownerWallet: "HzdQ9YbA1o7T7Gf3Kx4Pp8Lr2M1Vb6Yw3Nn5Rk4Qe2Pt",
    accumulatedRewardsUsdc: 0,
    rewardPoolUsdc: 0,
    projectedApy: 0,
    description:
      "Government monthly salary distribution for 278 verified municipal workers. Workers claim after the lock period ends.",
    beneficiaries: [
      {
        wallet: "G5pQ3YbB1n6R7Hf2Jx3Oo7Kr1L0Ub5Xw2Mm4Qj3Pe1Os",
        basisPoints: 500,
      },
      {
        wallet: "T8rW6VcD4q9S0Ig5Mx6Rr0Ns4M3Wf8Zy5Pp7Tk6Uf4Rv",
        basisPoints: 500,
      },
      {
        wallet: "K2sX9WdE5r0T1Jh6Ny7Ss1Ot5N4Xg9Az6Qq8Ul7Vg5Sw",
        basisPoints: 500,
      },
      {
        wallet: "L3tY0XeF6s1U2Ki7Oz8Tt2Pu6O5Yh0Ba7Rr9Vm8Wh6Tx",
        basisPoints: 500,
      },
      {
        wallet: "M4uZ1YfG7t2V3Lj8Pa9Uu3Qv7P6Zi1Cb8Ss0Wn9Xi7Uy",
        basisPoints: 500,
      },
    ],
    whitelistCount: 278,
    releaseAmountUsdc: 1260,
    cadence: "monthly",
  },
];

export const seededRewardHistory: RewardPoolPoint[] = [
  { month: "Jan", value: 180 },
  { month: "Feb", value: 320 },
  { month: "Mar", value: 250 },
  { month: "Apr", value: 480 },
  { month: "May", value: 530 },
  { month: "Jun", value: 710 },
  { month: "Jul", value: 940 },
];
