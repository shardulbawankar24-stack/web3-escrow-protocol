"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { PROGRAM_ID, USDC_MINT_BY_CLUSTER } from "@/lib/constants";
import { shortenAddress } from "@/lib/format";

interface BlockchainTrustBadgeProps {
  vaultId?: string;
  compact?: boolean;
}

export function BlockchainTrustBadge({ vaultId, compact = false }: BlockchainTrustBadgeProps) {
  const { selectedCluster, auditLogs } = useEscrowStore();
  const vaultLogs = vaultId
    ? auditLogs.filter((log) => log.vaultId === vaultId)
    : auditLogs;
  const confirmedCount = vaultLogs.filter((log) => log.status === "simulated" || log.status === "confirmed").length;
  const explorerBase =
    selectedCluster === "mainnet-beta"
      ? "https://explorer.solana.com"
      : `https://explorer.solana.com/?cluster=${selectedCluster}`;
  const usdcMint = USDC_MINT_BY_CLUSTER[selectedCluster];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2">
        <ShieldCheck size={14} className="text-emerald-300" />
        <span className="font-headline text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200">
          Verified on Solana
        </span>
        <span className="text-[10px] text-emerald-300/60">{selectedCluster}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/5 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15">
          <ShieldCheck size={20} className="text-emerald-300" />
        </div>
        <div>
          <h4 className="font-headline text-base font-semibold text-emerald-200">
            Blockchain Verified
          </h4>
          <p className="text-xs text-emerald-300/60">
            All data is publicly verifiable on Solana {selectedCluster}
          </p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-3 py-2">
          <dt className="text-[var(--on-surface-variant)]">Network</dt>
          <dd className="font-headline text-xs font-semibold uppercase tracking-wider text-emerald-200">
            {selectedCluster}
          </dd>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-3 py-2">
          <dt className="text-[var(--on-surface-variant)]">Program ID</dt>
          <dd className="font-mono text-xs text-[var(--outline)]">
            {shortenAddress(PROGRAM_ID)}
          </dd>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-3 py-2">
          <dt className="text-[var(--on-surface-variant)]">USDC Mint</dt>
          <dd className="font-mono text-xs text-[var(--outline)]">
            {shortenAddress(usdcMint)}
          </dd>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-3 py-2">
          <dt className="text-[var(--on-surface-variant)]">Recorded Transactions</dt>
          <dd className="font-headline font-bold text-emerald-200">
            {confirmedCount}
          </dd>
        </div>
      </dl>

      <a
        href={explorerBase}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-300 transition hover:text-emerald-100"
      >
        Open Solana Explorer <ExternalLink size={12} />
      </a>
    </div>
  );
}
