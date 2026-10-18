-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "strategyLabel" TEXT NOT NULL,
    "lockEndsAt" DATETIME NOT NULL,
    "principalUsdc" REAL NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "accumulatedRewardsUsdc" REAL NOT NULL DEFAULT 0,
    "rewardPoolUsdc" REAL NOT NULL DEFAULT 0,
    "projectedApy" REAL NOT NULL DEFAULT 0,
    "targetUsdc" REAL,
    "whitelistCount" INTEGER,
    "releaseAmountUsdc" REAL,
    "cadence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RewardHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Vault_vaultId_key" ON "Vault"("vaultId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardHistory_month_key" ON "RewardHistory"("month");
