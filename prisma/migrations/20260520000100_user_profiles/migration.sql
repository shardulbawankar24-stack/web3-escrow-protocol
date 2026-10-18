CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "walletAddress" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "organizationName" TEXT,
  "purpose" TEXT NOT NULL,
  "purposeDetails" TEXT,
  "signedMessage" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_walletAddress_key" ON "UserProfile"("walletAddress");
