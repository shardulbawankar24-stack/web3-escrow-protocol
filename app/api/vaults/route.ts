import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BPS_DENOMINATOR } from "@/lib/constants";
import { BeneficiaryShare, VaultRecord, VaultType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface DbVault {
  vaultId: string;
  name: string;
  type: string;
  status: string;
  strategyLabel: string;
  lockEndsAt: Date | string;
  principalUsdc: number;
  ownerWallet: string;
  accumulatedRewardsUsdc: number;
  rewardPoolUsdc: number;
  projectedApy: number;
  useAaveYield: boolean | number;
  aaveLockDays: number | null;
  aaveStatus: string | null;
  targetUsdc: number | null;
  whitelistCount: number | null;
  releaseAmountUsdc: number | null;
  cadence: string | null;
  beneficiaries: string | null;
}

function parseBeneficiaries(value: string | null): BeneficiaryShare[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is BeneficiaryShare =>
          typeof item?.wallet === "string" && typeof item?.basisPoints === "number"
      );
    }
  } catch {
    const wallets = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const equalShare = wallets.length > 0 ? Math.floor(BPS_DENOMINATOR / wallets.length) : 0;
    return wallets.map((wallet, idx) => ({
      wallet,
      basisPoints:
        idx === wallets.length - 1 ? BPS_DENOMINATOR - equalShare * (wallets.length - 1) : equalShare,
    }));
  }

  return undefined;
}

function toTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function toVaultRecord(vault: DbVault): VaultRecord {
  return {
    id: vault.vaultId,
    name: vault.name,
    type: vault.type as VaultType,
    status: vault.status as VaultRecord["status"],
    strategyLabel: vault.strategyLabel,
    lockEndsAt: toTimestamp(vault.lockEndsAt),
    principalUsdc: vault.principalUsdc,
    ownerWallet: vault.ownerWallet,
    accumulatedRewardsUsdc: vault.accumulatedRewardsUsdc,
    rewardPoolUsdc: vault.rewardPoolUsdc,
    projectedApy: vault.projectedApy,
    useAaveYield: Boolean(vault.useAaveYield),
    aaveLockDays: vault.aaveLockDays ?? undefined,
    aaveStatus: (vault.aaveStatus as VaultRecord["aaveStatus"]) ?? undefined,
    targetUsdc: vault.targetUsdc ?? undefined,
    whitelistCount: vault.whitelistCount ?? undefined,
    releaseAmountUsdc: vault.releaseAmountUsdc ?? undefined,
    cadence: (vault.cadence as VaultRecord["cadence"]) ?? undefined,
    beneficiaries: parseBeneficiaries(vault.beneficiaries),
  };
}

export async function GET() {
  try {
    const vaults = await prisma.$queryRaw<DbVault[]>`
      SELECT vaultId, name, type, status, strategyLabel, lockEndsAt, principalUsdc, ownerWallet,
             accumulatedRewardsUsdc, rewardPoolUsdc, projectedApy, useAaveYield, aaveLockDays,
             aaveStatus, targetUsdc, whitelistCount, releaseAmountUsdc, cadence, beneficiaries
      FROM Vault
      ORDER BY createdAt DESC
    `;
    return NextResponse.json({ vaults: vaults.map(toVaultRecord) }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch vaults" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VaultRecord;
    const beneficiaries = body.beneficiaries ? JSON.stringify(body.beneficiaries) : null;

    await prisma.$executeRaw`
      INSERT INTO Vault (
        id, vaultId, name, type, status, strategyLabel, lockEndsAt, principalUsdc, ownerWallet,
        accumulatedRewardsUsdc, rewardPoolUsdc, projectedApy, useAaveYield, aaveLockDays,
        aaveStatus, targetUsdc, whitelistCount, releaseAmountUsdc, cadence, beneficiaries,
        createdAt, updatedAt
      )
      VALUES (
        ${body.id}, ${body.id}, ${body.name}, ${body.type}, ${body.status}, ${body.strategyLabel},
        ${new Date(body.lockEndsAt)}, ${body.principalUsdc}, ${body.ownerWallet},
        ${body.accumulatedRewardsUsdc}, ${body.rewardPoolUsdc}, ${body.projectedApy},
        ${body.useAaveYield ?? false}, ${body.aaveLockDays ?? null}, ${body.aaveStatus ?? null},
        ${body.targetUsdc ?? null}, ${body.whitelistCount ?? null}, ${body.releaseAmountUsdc ?? null},
        ${body.cadence ?? null}, ${beneficiaries}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(vaultId) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        status = excluded.status,
        strategyLabel = excluded.strategyLabel,
        lockEndsAt = excluded.lockEndsAt,
        principalUsdc = excluded.principalUsdc,
        ownerWallet = excluded.ownerWallet,
        accumulatedRewardsUsdc = excluded.accumulatedRewardsUsdc,
        rewardPoolUsdc = excluded.rewardPoolUsdc,
        projectedApy = excluded.projectedApy,
        useAaveYield = excluded.useAaveYield,
        aaveLockDays = excluded.aaveLockDays,
        aaveStatus = excluded.aaveStatus,
        targetUsdc = excluded.targetUsdc,
        whitelistCount = excluded.whitelistCount,
        releaseAmountUsdc = excluded.releaseAmountUsdc,
        cadence = excluded.cadence,
        beneficiaries = excluded.beneficiaries,
        updatedAt = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ vault: body }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create vault in DB" }, { status: 500 });
  }
}
