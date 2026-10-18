import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  SolanaCluster,
  TransactionKind,
  TransactionStatus,
  TransparencyLogRecord,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface DbTransactionLog {
  id: string;
  vaultId: string;
  kind: string;
  status: string;
  cluster: string;
  signature: string | null;
  explorerUrl: string | null;
  amountUsdc: number;
  netAmountUsdc: number;
  penaltyUsdc: number;
  fromWallet: string | null;
  toWallet: string | null;
  memo: string;
  createdAt: Date | string;
}

function toTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function toLogRecord(log: DbTransactionLog): TransparencyLogRecord {
  return {
    id: log.id,
    vaultId: log.vaultId,
    kind: log.kind as TransactionKind,
    status: log.status as TransactionStatus,
    cluster: log.cluster as SolanaCluster,
    signature: log.signature ?? undefined,
    explorerUrl: log.explorerUrl ?? undefined,
    amountUsdc: log.amountUsdc,
    netAmountUsdc: log.netAmountUsdc,
    penaltyUsdc: log.penaltyUsdc,
    fromWallet: log.fromWallet ?? undefined,
    toWallet: log.toWallet ?? undefined,
    memo: log.memo,
    createdAt: toTimestamp(log.createdAt),
  };
}

export async function GET() {
  try {
    const logs = await prisma.$queryRaw<DbTransactionLog[]>`
      SELECT id, vaultId, kind, status, cluster, signature, explorerUrl,
             amountUsdc, netAmountUsdc, penaltyUsdc, fromWallet, toWallet, memo, createdAt
      FROM TransactionLog
      ORDER BY createdAt DESC
      LIMIT 100
    `;
    return NextResponse.json({ logs: logs.map(toLogRecord) }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const logs = Array.isArray(body.logs) ? body.logs : [body];

    await prisma.$transaction(
      logs.map((log: TransparencyLogRecord) =>
        prisma.$executeRaw`
          INSERT INTO TransactionLog (
            id, vaultId, kind, status, cluster, signature, explorerUrl, amountUsdc,
            netAmountUsdc, penaltyUsdc, fromWallet, toWallet, memo, createdAt
          )
          VALUES (
            ${log.id}, ${log.vaultId}, ${log.kind}, ${log.status}, ${log.cluster},
            ${log.signature ?? null}, ${log.explorerUrl ?? null}, ${log.amountUsdc},
            ${log.netAmountUsdc}, ${log.penaltyUsdc}, ${log.fromWallet ?? null},
            ${log.toWallet ?? null}, ${log.memo}, ${new Date(log.createdAt)}
          )
          ON CONFLICT(id) DO UPDATE SET
            vaultId = excluded.vaultId,
            kind = excluded.kind,
            status = excluded.status,
            cluster = excluded.cluster,
            signature = excluded.signature,
            explorerUrl = excluded.explorerUrl,
            amountUsdc = excluded.amountUsdc,
            netAmountUsdc = excluded.netAmountUsdc,
            penaltyUsdc = excluded.penaltyUsdc,
            fromWallet = excluded.fromWallet,
            toWallet = excluded.toWallet,
            memo = excluded.memo
        `
      )
    );

    return NextResponse.json({ logs }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record transactions" }, { status: 500 });
  }
}
