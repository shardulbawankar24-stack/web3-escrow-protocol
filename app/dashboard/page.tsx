"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, FileCheck2, Landmark, Plus, ShieldCheck } from "lucide-react";
import { RewardPoolChart } from "@/components/dashboard/reward-pool-chart";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TransparencyLog } from "@/components/protocol/transparency-log";
import { formatUsdc, getTimeLeft } from "@/lib/format";
import { requestVaultFunding, requiresWalletFunding } from "@/lib/solana-payments";

import { useWallet } from "@solana/wallet-adapter-react";

export default function DashboardPage() {
  const router = useRouter();
  const { publicKey: account } = useWallet();
  const { vaults, rewardHistory, auditLogs, selectedCluster, metrics, deposit } =
    useEscrowStore();
  const [selectedVaultId, setSelectedVaultId] = useState(vaults[0]?.id ?? "");
  const [amountUsdc, setAmountUsdc] = useState(1000);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeVaults = useMemo(
    () => vaults.filter((vault) => vault.status !== "claimed" && vault.status !== "closed"),
    [vaults]
  );

  const effectiveSelectedVaultId = useMemo(() => {
    if (vaults.find((vault) => vault.id === selectedVaultId)) {
      return selectedVaultId;
    }
    return vaults[0]?.id ?? "";
  }, [selectedVaultId, vaults]);

  async function onDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      setFeedback("Please connect your wallet first.");
      return;
    }
    setIsDepositing(true);
    try {
      const funding = requiresWalletFunding(selectedCluster)
        ? await requestVaultFunding({
            amountUsdc,
            cluster: selectedCluster,
          })
        : undefined;
      const tx = deposit(
        effectiveSelectedVaultId,
        amountUsdc,
        funding?.payerWallet ?? account.toBase58(),
        undefined,
        funding
      );
      setFeedback(
        `Deposited ${formatUsdc(tx.netAmountUsdc)} USDC into vault #${tx.id}. Receipt status: ${tx.status}.`
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Deposit failed.");
    } finally {
      setIsDepositing(false);
    }
  }

  return (
    <DashboardShell
      title="Dashboard"
      subtitle={`Dynamic Solana USDC vault analytics and actions on ${selectedCluster}.`}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-8">
          <article className="glass-panel ambient-shadow relative overflow-hidden p-8">
            <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
              Total Value Locked
            </p>
            <div className="mt-4 flex items-end gap-3">
              <p className="font-headline text-6xl font-bold tracking-tighter md:text-8xl">
                {formatUsdc(metrics.totalValueLockedUsdc)}
              </p>
              <p className="pb-2 text-2xl text-[var(--primary)]">USDC</p>
            </div>
            <p className="mt-4 text-sm text-[var(--on-surface-variant)]">
              <span className="text-[var(--primary)]">
                {metrics.weeklyGrowthPercent >= 0 ? "+" : ""}
                {metrics.weeklyGrowthPercent.toFixed(2)}%
              </span>{" "}
              from baseline snapshot
            </p>
          </article>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                  Total Rewards
                </p>
                <Landmark size={18} className="text-[var(--secondary)]" />
              </div>
              <p className="mt-4 font-headline text-5xl font-bold">
                {formatUsdc(metrics.totalRewardsUsdc)}{" "}
                <span className="text-lg text-[var(--secondary)]">USDC</span>
              </p>
            </article>
            <article className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                  Active Vaults
                </p>
                <ShieldCheck size={18} className="text-[var(--secondary)]" />
              </div>
              <p className="mt-4 font-headline text-5xl font-bold">{metrics.activeVaultCount}</p>
            </article>
          </div>

          <article id="analytics" className="glass-panel p-8">
            <div className="mb-8 flex items-center justify-between">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Reward Pool (Penalties)
              </p>
              <Link href="/vaults" className="text-sm text-[var(--secondary)]">
                View Details
              </Link>
            </div>
            <RewardPoolChart data={rewardHistory} />
          </article>

          <article className="glass-panel p-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                  Transparency Logs
                </p>
                <h2 className="mt-2 font-headline text-3xl font-semibold">Latest Fund Movement</h2>
              </div>
              <FileCheck2 className="text-[var(--primary)]" size={26} />
            </div>
            <TransparencyLog logs={auditLogs.slice(0, 5)} />
          </article>
        </section>

        <aside className="space-y-8 lg:col-span-4">
          <section className="glass-panel p-6">
            <h3 className="font-headline text-sm uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
              Quick Actions
            </h3>
            <form onSubmit={onDeposit} className="mt-5 space-y-3">
              <select
                value={effectiveSelectedVaultId}
                onChange={(event) => setSelectedVaultId(event.target.value)}
                className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 text-sm"
              >
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name} #{vault.id}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={amountUsdc}
                onChange={(event) => setAmountUsdc(Number(event.target.value))}
                className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3"
              />
              <button
                type="button"
                onClick={() => router.push("/create-vault")}
                className="flex w-full items-center justify-center gap-2 rounded-full gradient-bg py-4 font-headline text-sm font-bold text-[var(--on-primary)]"
              >
                <Plus size={16} />
                Create Vault
              </button>
              <button
                type="submit"
                disabled={!account || isDepositing}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(45_52_73/20%)] py-3 font-headline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDown size={16} />
                {isDepositing ? "Processing" : "Deposit"}
              </button>
            </form>
            {feedback ? (
              <p className="mt-3 text-xs text-[var(--secondary)]" role="status">
                {feedback}
              </p>
            ) : null}
          </section>

          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-headline text-sm uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Active Vaults
              </h3>
              <span className="rounded-sm border border-[var(--secondary)]/20 bg-[var(--surface-container)] px-2 py-1 text-[10px] text-[var(--secondary)]">
                {activeVaults.length} ACTIVE
              </span>
            </div>
            <div className="space-y-4">
              {activeVaults.slice(0, 3).map((vault) => {
                const left = getTimeLeft(vault.lockEndsAt, now);
                const runtimeStatus =
                  left.isUnlocked && vault.status === "active" ? "unlocked" : vault.status;
                return (
                  <Link
                    key={vault.id}
                    href={`/vaults/${vault.id}`}
                    className="block rounded-xl border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] p-4 transition hover:bg-[var(--surface-container-highest)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-headline text-xl font-bold transition-colors group-hover:text-[var(--primary)]">
                          {vault.name}
                        </p>
                        <p className="mt-1 text-[10px] uppercase text-[var(--on-surface-variant)]">
                          {vault.strategyLabel}
                        </p>
                      </div>
                      <span className="rounded-sm bg-[var(--surface-container)] px-2 py-1 text-[10px] text-[var(--secondary)]">
                        {runtimeStatus}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="font-headline text-2xl font-bold">
                          {formatUsdc(vault.principalUsdc)}
                          <span className="ml-1 text-xs text-[var(--on-surface-variant)]">USDC</span>
                        </p>
                        {vault.explorerUrl && (
                          <a href={vault.explorerUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
                            Explorer ↗
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--on-surface-variant)]">Unlocks in</p>
                        <p className="font-headline text-sm text-[var(--secondary)]">
                          {left.days}d : {left.hours}h
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/vaults" className="mt-6 block text-center text-xs text-[var(--secondary)]">
              View All Vaults
            </Link>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
