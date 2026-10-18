"use client";

import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Landmark,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { formatUsdc, shortenAddress } from "@/lib/format";
import { TransparencyLogRecord, TransactionKind } from "@/lib/types";

const iconByKind: Record<TransactionKind, typeof ShieldCheck> = {
  create_vault: ShieldCheck,
  deposit: ArrowDownLeft,
  withdraw: ArrowUpRight,
  claim: LockKeyhole,
  beneficiary_release: Send,
  aave_supply: Landmark,
};

const labelByKind: Record<TransactionKind, string> = {
  create_vault: "Vault created",
  deposit: "USDC deposited",
  withdraw: "USDC withdrawn",
  claim: "Vault claimed",
  beneficiary_release: "Beneficiary paid",
  aave_supply: "Aave supply queued",
};

export function TransparencyLog({
  logs,
  emptyText = "No transaction logs yet.",
}: {
  logs: TransparencyLogRecord[];
  emptyText?: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[rgb(62_74_63/30%)] bg-[var(--surface-container-low)] p-8 text-center text-sm text-[var(--on-surface-variant)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const Icon = iconByKind[log.kind];
        return (
          <article
            key={log.id}
            className="rounded-lg border border-[rgb(62_74_63/18%)] bg-[var(--surface-container-low)] p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container-highest)] text-[var(--primary)]">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-headline text-base font-semibold">{labelByKind[log.kind]}</h4>
                    <span
                      className={clsx(
                        "rounded-sm px-2 py-1 text-[10px] uppercase tracking-[0.12em]",
                        log.status === "confirmed"
                          ? "bg-emerald-400/15 text-emerald-200"
                          : log.status === "pending"
                            ? "bg-amber-400/15 text-amber-200"
                            : "bg-sky-400/15 text-sky-200"
                      )}
                    >
                      {log.status}
                    </span>
                    <span className="rounded-sm bg-[var(--surface-container)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--on-surface-variant)]">
                      {log.cluster}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--on-surface-variant)]">{log.memo}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--outline)]">
                    {log.fromWallet ? <span>From {shortenAddress(log.fromWallet)}</span> : null}
                    {log.toWallet ? <span>To {shortenAddress(log.toWallet)}</span> : null}
                    {log.signature ? <span>Sig {shortenAddress(log.signature)}</span> : null}
                  </div>
                </div>
              </div>

              <div className="min-w-36 text-left sm:text-right">
                <p className="font-headline text-xl font-bold">{formatUsdc(log.netAmountUsdc)} USDC</p>
                {log.penaltyUsdc > 0 ? (
                  <p className="text-xs text-red-200">Penalty {formatUsdc(log.penaltyUsdc)} USDC</p>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-[var(--secondary)] sm:justify-end">
                    <CheckCircle2 size={12} />
                    Complete
                  </p>
                )}
                {log.explorerUrl ? (
                  <a
                    href={log.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--primary)]"
                  >
                    Solana Explorer <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-[var(--outline)]">Explorer-ready after real signature</p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
