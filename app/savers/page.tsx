"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, PiggyBank, Plus, TrendingUp } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { RewardPoolChart } from "@/components/dashboard/reward-pool-chart";
import { TransparencyLog } from "@/components/protocol/transparency-log";
import { BlockchainTrustBadge } from "@/components/protocol/blockchain-trust-badge";
import { formatUsdc, getTimeLeft } from "@/lib/format";
import { requestVaultFunding, requiresWalletFunding } from "@/lib/solana-payments";

export default function SaversPage() {
  const { publicKey: account } = useWallet();
  const { getVaultsByType, rewardHistory, auditLogs, deposit, withdraw, selectedCluster } = useEscrowStore();
  const saverVaults = getVaultsByType("saver");
  const activeVaults = useMemo(() => saverVaults.filter((v) => v.status !== "claimed" && v.status !== "closed"), [saverVaults]);
  const saverLogs = useMemo(() => auditLogs.filter((l) => saverVaults.some((v) => v.id === l.vaultId)), [auditLogs, saverVaults]);
  const tvl = useMemo(() => saverVaults.reduce((s, v) => s + (v.status === "claimed" ? 0 : v.principalUsdc), 0), [saverVaults]);
  const totalRewards = useMemo(() => saverVaults.reduce((s, v) => s + v.rewardPoolUsdc + v.accumulatedRewardsUsdc, 0), [saverVaults]);
  const [selectedVaultId, setSelectedVaultId] = useState(saverVaults[0]?.id ?? "");
  const [amount, setAmount] = useState(1000);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => { const u = () => setNow(Date.now()); u(); const t = setInterval(u, 1000); return () => clearInterval(t); }, []);
  const effectiveId = useMemo(() => saverVaults.find((v) => v.id === selectedVaultId) ? selectedVaultId : saverVaults[0]?.id ?? "", [selectedVaultId, saverVaults]);

  async function onDeposit(e: React.FormEvent) { e.preventDefault(); if (!account) { setFeedback("Connect wallet first."); return; } setIsDepositing(true); try { const funding = requiresWalletFunding(selectedCluster) ? await requestVaultFunding({ amountUsdc: amount, cluster: selectedCluster }) : undefined; const tx = deposit(effectiveId, amount, funding?.payerWallet ?? account.toBase58(), undefined, funding); setFeedback(`Deposited ${formatUsdc(tx.netAmountUsdc)} USDC.`); } catch (err) { setFeedback(err instanceof Error ? err.message : "Failed."); } finally { setIsDepositing(false); } }
  function onEmergencyWithdraw() { if (!account) { setFeedback("Connect wallet first."); return; } try { const tx = withdraw(effectiveId, amount, true, account.toBase58()); setFeedback(tx.penaltyUsdc > 0 ? `Exit: ${formatUsdc(tx.netAmountUsdc)} returned, ${formatUsdc(tx.penaltyUsdc)} penalty.` : `Withdrawn ${formatUsdc(tx.netAmountUsdc)} USDC.`); } catch (err) { setFeedback(err instanceof Error ? err.message : "Failed."); } }

  return (
    <DashboardShell title="Saver's Vault" subtitle="Personal savings with financial discipline. Early exit penalties reward committed savers.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <article className="glass-panel p-6"><p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Saver TVL</p><p className="mt-3 font-headline text-4xl font-bold">{formatUsdc(tvl)}</p><p className="text-sm text-[var(--on-surface-variant)]">USDC</p></article>
            <article className="glass-panel p-6"><p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Discipline Rewards</p><p className="mt-3 font-headline text-4xl font-bold text-[var(--secondary)]">{formatUsdc(totalRewards)}</p><p className="text-sm text-[var(--on-surface-variant)]">from penalties</p></article>
            <article className="glass-panel p-6"><p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Active Vaults</p><p className="mt-3 font-headline text-4xl font-bold">{activeVaults.length}</p></article>
          </div>
          <article className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-6">
            <div className="flex items-center gap-3 mb-3"><TrendingUp size={20} className="text-amber-200" /><h3 className="font-headline text-xl font-semibold text-amber-200">5% Discipline Mechanism</h3></div>
            <p className="text-sm text-[var(--on-surface-variant)]">When savers exit early, they pay a 5% penalty redistributed to disciplined holders. The longer you hold, the more you earn.</p>
          </article>
          <article className="glass-panel p-8"><p className="mb-6 font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Penalty Redistribution Pool</p><RewardPoolChart data={rewardHistory} /></article>
          <article className="glass-panel p-8">
            <div className="mb-6 flex items-center justify-between"><h3 className="font-headline text-2xl font-semibold">Your Saver Vaults</h3><Link href="/create-vault" className="flex items-center gap-2 rounded-full gradient-bg px-5 py-2 text-sm font-bold text-[var(--on-primary)]"><Plus size={14} /> New Vault</Link></div>
            {activeVaults.length === 0 ? <p className="text-sm text-[var(--on-surface-variant)]">No active saver vaults yet.</p> : (
              <div className="space-y-4">{activeVaults.map((vault) => { const left = getTimeLeft(vault.lockEndsAt, now); const st = left.isUnlocked && vault.status === "active" ? "unlocked" : vault.status; return (
                <Link key={vault.id} href={`/vaults/${vault.id}`} className="block rounded-xl border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] p-5 transition hover:bg-[var(--surface-container-highest)]">
                  <div className="flex items-start justify-between"><div><p className="font-headline text-xl font-bold">{vault.name}</p><p className="text-xs text-[var(--on-surface-variant)]">{vault.strategyLabel}</p></div><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] uppercase text-emerald-200">{st}</span></div>
                  <div className="mt-4 flex items-end justify-between"><p className="font-headline text-3xl font-bold">{formatUsdc(vault.principalUsdc)} <span className="text-sm text-[var(--on-surface-variant)]">USDC</span></p><div className="text-right"><p className="text-[10px] text-[var(--on-surface-variant)]">{left.isUnlocked ? "Claim ready" : "Unlocks in"}</p>{!left.isUnlocked && <p className="font-headline text-sm text-[var(--secondary)]">{left.days}d : {left.hours}h</p>}</div></div>
                  {vault.accumulatedRewardsUsdc > 0 && <p className="mt-2 text-xs text-emerald-300">+{formatUsdc(vault.accumulatedRewardsUsdc)} USDC discipline rewards</p>}
                </Link>); })}</div>)}
          </article>
          <article className="glass-panel p-8"><div className="mb-6"><p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">On-Chain Transparency</p><h3 className="mt-2 font-headline text-2xl font-semibold">Saver Transaction Trail</h3></div><TransparencyLog logs={saverLogs.slice(0, 10)} emptyText="No saver transactions yet." /></article>
        </section>
        <aside className="lg:col-span-4 space-y-8">
          <section className="glass-panel p-6">
            <h3 className="font-headline text-sm uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Quick Actions</h3>
            <form onSubmit={onDeposit} className="mt-5 space-y-3">
              <select value={effectiveId} onChange={(e) => setSelectedVaultId(e.target.value)} className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 text-sm">{saverVaults.map((v) => <option key={v.id} value={v.id}>{v.name} #{v.id}</option>)}</select>
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3" />
              <button type="submit" disabled={!account || isDepositing} className="flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(45_52_73/20%)] py-3 font-headline text-sm disabled:opacity-50"><ArrowDown size={16} /> {isDepositing ? "Processing" : "Deposit"}</button>
              <button type="button" disabled={!account} onClick={onEmergencyWithdraw} className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300/30 py-3 font-headline text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"><AlertTriangle size={16} /> Emergency Withdraw (5%)</button>
            </form>
            {feedback && <p className="mt-3 text-xs text-[var(--secondary)]" role="status">{feedback}</p>}
          </section>
          <section className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-4"><PiggyBank size={20} className="text-emerald-300" /><h3 className="font-headline text-base font-semibold">Who Is This For?</h3></div>
            <ul className="space-y-2 text-sm text-[var(--on-surface-variant)]">
              <li>• Students saving for tuition or gadgets</li>
              <li>• Salaried employees building emergency funds</li>
              <li>• Crypto holders wanting disciplined savings</li>
              <li>• Families saving without emotional spending</li>
            </ul>
          </section>
          <BlockchainTrustBadge />
        </aside>
      </div>
    </DashboardShell>
  );
}
