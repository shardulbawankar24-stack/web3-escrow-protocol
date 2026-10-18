-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "signature" TEXT,
    "explorerUrl" TEXT,
    "amountUsdc" REAL NOT NULL,
    "netAmountUsdc" REAL NOT NULL,
    "penaltyUsdc" REAL NOT NULL DEFAULT 0,
    "fromWallet" TEXT,
    "toWallet" TEXT,
    "memo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
