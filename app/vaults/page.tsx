"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Landmark, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { formatUsdc, getTimeLeft } from "@/lib/format";

export default function VaultsPage() {
  const { vaults, selectedCluster } = useEscrowStore();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sorted = useMemo(
    () => [...vaults].sort((a, b) => b.principalUsdc - a.principalUsdc),
    [vaults]
  );

  return (
    <DashboardShell
      title="My Vaults"
      subtitle={`Live vault balances, lock timers, and claim readiness on ${selectedCluster}.`}
    >
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((vault) => {
          const left = getTimeLeft(vault.lockEndsAt, now);
          const runtimeStatus =
            left.isUnlocked && vault.status === "active" ? "unlocked" : vault.status;
          return (
            <Link key={vault.id} href={`/vaults/${vault.id}`} className="glass-panel p-6">
              <div className="flex items-start justify-between">
                <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--primary)]">
                  {vault.type} Vault
                </p>
                <span className="rounded-sm bg-[var(--surface-container-high)] px-2 py-1 text-[10px] uppercase text-[var(--secondary)]">
                  {runtimeStatus}
                </span>
              </div>
              <h2 className="mt-3 font-headline text-3xl font-semibold tracking-tight">
                {vault.name}
              </h2>
              <p className="mt-4 font-headline text-5xl font-bold">
                {formatUsdc(vault.principalUsdc)}
              </p>
              <p className="text-sm text-[var(--on-surface-variant)]">USDC</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-[var(--on-surface-variant)]">
                <div className="rounded-lg bg-[var(--surface-container-low)] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[var(--secondary)]">
                    <Users size={14} />
                    Beneficiaries
                  </div>
                  <p>{vault.beneficiaries?.length ?? vault.whitelistCount ?? 1}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-container-low)] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[var(--secondary)]">
                    <Landmark size={14} />
                    Yield
                  </div>
                  <p>{vault.useAaveYield ? "Aave queued" : `${vault.projectedApy.toFixed(1)}% APY`}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-[rgb(62_74_63/15%)] pt-4 text-sm text-[var(--on-surface-variant)]">
                {left.isUnlocked ? (
                  <p className="text-[var(--primary)]">Unlocked • Claim ready</p>
                ) : (
                  <p>
                    Unlocks in {left.days} days, {left.hours} hours
                  </p>
                )}
                <p className="mt-1 text-xs">Vault ID #{vault.id}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </DashboardShell>
  );
}
