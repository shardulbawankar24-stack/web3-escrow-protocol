"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Users, Landmark, Clock, FileText } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { TransparencyLog } from "@/components/protocol/transparency-log";
import { BlockchainTrustBadge } from "@/components/protocol/blockchain-trust-badge";
import { formatUsdc, getTimeLeft } from "@/lib/format";

export default function DispensationPage() {
  const { publicKey: account } = useWallet();
  const { getVaultsByType, auditLogs } = useEscrowStore();
  const dispensationVaults = getVaultsByType("dispensation");
  const activeVaults = useMemo(
    () => dispensationVaults.filter((v) => v.status !== "claimed" && v.status !== "closed"),
    [dispensationVaults]
  );
  const dispensationLogs = useMemo(() => {
    if (!account) return [];
    // Only organization members (owners of the vault) can see its logs.
    const ownedVaultIds = new Set(
      dispensationVaults
        .filter((v) => v.ownerWallet && v.ownerWallet.toLowerCase() === account.toBase58().toLowerCase())
        .map((v) => v.id)
    );
    return auditLogs.filter((l) => ownedVaultIds.has(l.vaultId));
  }, [auditLogs, dispensationVaults, account]);
  const tvl = useMemo(
    () => dispensationVaults.reduce((s, v) => s + (v.status === "claimed" ? 0 : v.principalUsdc), 0),
    [dispensationVaults]
  );
  const totalRecipients = useMemo(
    () => dispensationVaults.reduce((s, v) => s + (v.whitelistCount ?? v.beneficiaries?.length ?? 0), 0),
    [dispensationVaults]
  );

  const [now, setNow] = useState(0);

  useEffect(() => {
    const u = () => setNow(Date.now());
    u();
    const t = setInterval(u, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <DashboardShell
      title="Dispensation Vault"
      subtitle="Automated payment infrastructure for governments and enterprises. Lock funds, set schedules, and let recipients claim transparently."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Total Budget Locked
              </p>
              <p className="mt-3 font-headline text-4xl font-bold text-indigo-300">
                {formatUsdc(tvl)}
              </p>
              <p className="text-sm text-[var(--on-surface-variant)]">USDC</p>
            </article>
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Active Vaults
              </p>
              <p className="mt-3 font-headline text-4xl font-bold">{activeVaults.length}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">processing</p>
            </article>
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Recipients
              </p>
              <p className="mt-3 font-headline text-4xl font-bold">{totalRecipients}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">whitelisted</p>
            </article>
          </div>

          {/* Feature Banner */}
          <article className="rounded-xl border border-indigo-300/20 bg-indigo-400/5 p-6">
            <div className="mb-3 flex items-center gap-3">
              <Landmark size={20} className="text-indigo-300" />
              <h3 className="font-headline text-xl font-semibold text-indigo-200">
                Transparent Payroll & Distribution
              </h3>
            </div>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Authority deposits funds, and workers/citizens claim individually after the lock period ends. 
              The schedule and recipient lists are completely transparent and verifiable on-chain, eliminating hidden 
              delays or manual processing intermediaries. 
              <strong className="text-indigo-200 block mt-2">Authority can modify recipients up until the unlock date. No early emergency withdraws are permitted.</strong>
            </p>
          </article>

          {/* Vault List */}
          <article className="glass-panel p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-2xl font-semibold">Active Dispensation Vaults</h3>
              <Link
                href="/create-vault"
                className="flex items-center gap-2 rounded-full gradient-bg px-5 py-2 text-sm font-bold text-[var(--on-primary)]"
              >
                <Plus size={14} /> New Vault
              </Link>
            </div>
            {activeVaults.length === 0 ? (
              <p className="text-sm text-[var(--on-surface-variant)]">
                No active dispensation vaults yet.
              </p>
            ) : (
              <div className="space-y-4">
                {activeVaults.map((vault) => {
                  const left = getTimeLeft(vault.lockEndsAt, now);
                  const st = left.isUnlocked && vault.status === "active" ? "unlocked" : vault.status;
                  
                  return (
                    <Link
                      key={vault.id}
                      href={`/vaults/${vault.id}`}
                      className="block rounded-xl border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] p-5 transition hover:bg-[var(--surface-container-highest)]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-indigo-400/15 px-3 py-1 text-[10px] uppercase text-indigo-200">
                              {vault.type}
                            </span>
                            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] uppercase text-emerald-200">
                              {st}
                            </span>
                          </div>
                          <p className="mt-2 font-headline text-xl font-bold">{vault.name}</p>
                          {vault.description && (
                            <p className="mt-1 text-xs text-[var(--on-surface-variant)] line-clamp-1">
                              {vault.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-headline text-2xl font-bold text-indigo-300">
                            {formatUsdc(vault.principalUsdc)}
                          </p>
                          <p className="text-[10px] text-[var(--on-surface-variant)]">USDC LOCKED</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[rgb(62_74_63/20%)] pt-4">
                        <div className="flex gap-4 text-xs text-[var(--on-surface-variant)]">
                          <span className="flex items-center gap-1">
                            <Users size={14} className="text-indigo-300" />
                            {vault.whitelistCount ?? vault.beneficiaries?.length ?? 0} Recipients
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="text-indigo-300" />
                            {vault.cadence === "monthly" ? "Monthly" : "Weekly"} Schedule
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                            {left.isUnlocked ? "Claim Ready" : "Unlocks In"}
                          </p>
                          {!left.isUnlocked && (
                            <p className="font-headline text-sm font-semibold text-[var(--secondary)]">
                              {left.days}d : {left.hours}h
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>
          
          <article className="glass-panel p-8">
            <div className="mb-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                On-Chain Transparency
              </p>
              <h3 className="mt-2 font-headline text-2xl font-semibold">Public Authority Logs</h3>
            </div>
            <TransparencyLog logs={dispensationLogs.slice(0, 10)} emptyText="No dispensation transactions yet." />
          </article>
        </section>

        <aside className="space-y-8 lg:col-span-4">
          <section className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <Building2 size={20} className="text-indigo-300" />
              <h3 className="font-headline text-base font-semibold">Who Is This For?</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--on-surface-variant)]">
              <li>• Governments issuing welfare safely</li>
              <li>• Companies automating global payroll</li>
              <li>• Blockchain DAOs paying contributors</li>
              <li>• Automated freelancer escrows</li>
            </ul>
          </section>

          <section className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileText size={20} className="text-emerald-300" />
              <h3 className="font-headline text-base font-semibold">Dispensation Rules</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--on-surface-variant)]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-300">✓</span>
                Authority deposits USDC up front
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-300">✓</span>
                Worker claiming reduces network load
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-300">✓</span>
                Recipients can be updated before unlock
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                No emergency early withdrawals allowed
              </li>
            </ul>
          </section>
          
          <BlockchainTrustBadge />
        </aside>
      </div>
    </DashboardShell>
  );
}
