"use client";

import clsx from "clsx";
import { Network } from "lucide-react";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { SOLANA_CLUSTERS, USDC_MINT_BY_CLUSTER } from "@/lib/constants";

export function EnvironmentSwitcher() {
  const { selectedCluster, setSelectedCluster } = useEscrowStore();

  return (
    <div className="rounded-full border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] p-1">
      <div className="flex items-center gap-1">
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-container)] text-[var(--secondary)] lg:flex">
          <Network size={15} />
        </div>
        {SOLANA_CLUSTERS.map((cluster) => (
          <button
            key={cluster.id}
            type="button"
            title={`${cluster.label} USDC mint: ${USDC_MINT_BY_CLUSTER[cluster.id]}`}
            onClick={() => setSelectedCluster(cluster.id)}
            className={clsx(
              "rounded-full px-3 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] transition",
              selectedCluster === cluster.id
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--foreground)]"
            )}
          >
            {cluster.label}
          </button>
        ))}
      </div>
    </div>
  );
}
