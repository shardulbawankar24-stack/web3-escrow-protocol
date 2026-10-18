"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Eye, Heart, HeartHandshake, Plus, Shield, Users } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { TransparencyLog } from "@/components/protocol/transparency-log";
import { BlockchainTrustBadge } from "@/components/protocol/blockchain-trust-badge";
import { DonorList } from "@/components/vaults/donor-list";
import { formatUsdc, getTimeLeft } from "@/lib/format";
import { requestVaultFunding, requiresWalletFunding } from "@/lib/solana-payments";

export default function WelfarePage() {
  const { publicKey: account } = useWallet();
  const { getVaultsByType, auditLogs, deposit, selectedCluster } = useEscrowStore();
  const welfareVaults = getVaultsByType(["ngo", "welfare"]);
  const activeVaults = useMemo(
    () => welfareVaults.filter((v) => v.status !== "claimed" && v.status !== "closed"),
    [welfareVaults]
  );
  const welfareLogs = useMemo(
    () => auditLogs.filter((l) => welfareVaults.some((v) => v.id === l.vaultId)),
    [auditLogs, welfareVaults]
  );
  const tvl = useMemo(
    () => welfareVaults.reduce((s, v) => s + (v.status === "claimed" ? 0 : v.principalUsdc), 0),
    [welfareVaults]
  );
  const totalDonors = useMemo(
    () => welfareVaults.reduce((s, v) => s + (v.donors?.length ?? 0), 0),
    [welfareVaults]
  );
  const totalBeneficiaries = useMemo(
    () => welfareVaults.reduce((s, v) => s + (v.beneficiaries?.length ?? 0), 0),
    [welfareVaults]
  );

  const [selectedVaultId, setSelectedVaultId] = useState(welfareVaults[0]?.id ?? "");
  const [amount, setAmount] = useState(500);
  const [donorName, setDonorName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [now, setNow] = useState(0);
  const [expandedVaultId, setExpandedVaultId] = useState<string | null>(null);

  useEffect(() => {
    const u = () => setNow(Date.now());
    u();
    const t = setInterval(u, 1000);
    return () => clearInterval(t);
  }, []);

  const effectiveId = useMemo(
    () =>
      welfareVaults.find((v) => v.id === selectedVaultId)
        ? selectedVaultId
        : welfareVaults[0]?.id ?? "",
    [selectedVaultId, welfareVaults]
  );

  async function onDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      setFeedback("Connect wallet first.");
      return;
    }
    setIsDonating(true);
    try {
      const funding = requiresWalletFunding(selectedCluster)
        ? await requestVaultFunding({
            amountUsdc: amount,
            cluster: selectedCluster,
          })
        : undefined;
      const tx = deposit(
        effectiveId,
        amount,
        funding?.payerWallet ?? account.toBase58(),
        donorName,
        funding
      );
      setFeedback(
        `Donated ${formatUsdc(tx.netAmountUsdc)} USDC${donorName ? ` as "${donorName}"` : " anonymously"}. Thank you!`
      );
      setDonorName("");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Donation failed.");
    } finally {
      setIsDonating(false);
    }
  }

  return (
    <DashboardShell
      title="Welfare / NGO Vault"
      subtitle="Transparent, corruption-proof crowdfunding and charity distribution. Every donor and beneficiary is publicly verifiable."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Total Funds Locked
              </p>
              <p className="mt-3 font-headline text-4xl font-bold text-rose-300">
                {formatUsdc(tvl)}
              </p>
              <p className="text-sm text-[var(--on-surface-variant)]">USDC</p>
            </article>
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Verified Donors
              </p>
              <p className="mt-3 font-headline text-4xl font-bold">{totalDonors}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">on-chain records</p>
            </article>
            <article className="glass-panel p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Beneficiaries
              </p>
              <p className="mt-3 font-headline text-4xl font-bold">{totalBeneficiaries}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">receiving funds</p>
            </article>
          </div>

          {/* Trust Banner */}
          <article className="rounded-xl border border-rose-300/20 bg-rose-400/5 p-6">
            <div className="mb-3 flex items-center gap-3">
              <Shield size={20} className="text-rose-300" />
              <h3 className="font-headline text-xl font-semibold text-rose-200">
                Zero Corruption Guarantee
              </h3>
            </div>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Smart contracts enforce all rules. Even the vault admin{" "}
              <strong className="text-rose-200">cannot steal funds</strong>,{" "}
              <strong className="text-rose-200">cannot change allocations</strong>, and{" "}
              <strong className="text-rose-200">cannot unlock early</strong>. Donors and
              beneficiaries are publicly visible on the blockchain.
            </p>
          </article>

          {/* Vault List with Donor/Beneficiary Details */}
          <article className="glass-panel p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-2xl font-semibold">Active Welfare Vaults</h3>
              <Link
                href="/create-vault"
                className="flex items-center gap-2 rounded-full gradient-bg px-5 py-2 text-sm font-bold text-[var(--on-primary)]"
              >
                <Plus size={14} /> New Vault
              </Link>
            </div>
            {activeVaults.length === 0 ? (
              <p className="text-sm text-[var(--on-surface-variant)]">
                No active welfare vaults yet.
              </p>
            ) : (
              <div className="space-y-6">
                {activeVaults.map((vault) => {
                  const left = getTimeLeft(vault.lockEndsAt, now);
                  const st =
                    left.isUnlocked && vault.status === "active" ? "unlocked" : vault.status;
                  const isExpanded = expandedVaultId === vault.id;

                  return (
                    <div
                      key={vault.id}
                      className="rounded-xl border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] overflow-hidden"
                    >
                      {/* Vault Header */}
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-rose-400/15 px-3 py-1 text-[10px] uppercase text-rose-200">
                                {vault.type}
                              </span>
                              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] uppercase text-emerald-200">
                                {st}
                              </span>
                            </div>
                            <p className="mt-2 font-headline text-xl font-bold">{vault.name}</p>
                            {vault.description && (
                              <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
                                {vault.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-headline text-2xl font-bold text-rose-300">
                              {formatUsdc(vault.principalUsdc)}
                            </p>
                            <p className="text-xs text-[var(--on-surface-variant)]">USDC locked</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex gap-4 text-xs text-[var(--on-surface-variant)]">
                            <span className="flex items-center gap-1">
                              <Heart size={12} className="text-rose-300" />
                              {vault.donors?.length ?? 0} donors
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-emerald-300" />
                              {vault.beneficiaries?.length ?? 0} beneficiaries
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-[var(--on-surface-variant)]">
                              {left.isUnlocked
                                ? "Claim ready"
                                : `${left.days}d : ${left.hours}h left`}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedVaultId(isExpanded ? null : vault.id)
                              }
                              className="flex items-center gap-1 rounded-full bg-[var(--surface-container-high)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--primary)] transition hover:bg-[var(--surface-container-highest)]"
                            >
                              <Eye size={12} />
                              {isExpanded ? "Hide" : "View"} Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-[rgb(62_74_63/15%)] p-5 space-y-6">
                          {/* Donor List */}
                          <div>
                            <h4 className="mb-3 font-headline text-lg font-semibold flex items-center gap-2">
                              <Heart size={16} className="text-rose-300" />
                              Public Donor List
                            </h4>
                            <DonorList
                              donors={vault.donors ?? []}
                              targetUsdc={vault.targetUsdc}
                              totalRaisedUsdc={vault.principalUsdc}
                            />
                          </div>

                          {/* Beneficiary List */}
                          {vault.beneficiaries && vault.beneficiaries.length > 0 && (
                            <div>
                              <h4 className="mb-3 font-headline text-lg font-semibold flex items-center gap-2">
                                <Users size={16} className="text-emerald-300" />
                                Public Beneficiary List
                              </h4>
                              <div className="space-y-2">
                                {vault.beneficiaries.map((b) => (
                                  <div
                                    key={b.wallet}
                                    className="grid items-center gap-3 rounded-lg bg-[var(--surface-container)] p-3 sm:grid-cols-[1fr_100px_120px]"
                                  >
                                    <p className="truncate font-mono text-sm">{b.wallet}</p>
                                    <p className="font-headline text-sm font-bold text-[var(--secondary)] sm:text-right">
                                      {(b.basisPoints / 100).toFixed(1)}%
                                    </p>
                                    <p className="font-headline text-sm font-bold text-rose-300 sm:text-right">
                                      {formatUsdc(
                                        (vault.principalUsdc * b.basisPoints) / 10000
                                      )}{" "}
                                      USDC
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Link
                            href={`/vaults/${vault.id}`}
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)]"
                          >
                            View full vault details →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Transparency Logs */}
          <article className="glass-panel p-8">
            <div className="mb-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                On-Chain Transparency
              </p>
              <h3 className="mt-2 font-headline text-2xl font-semibold">
                Welfare Transaction Trail
              </h3>
            </div>
            <TransparencyLog
              logs={welfareLogs.slice(0, 10)}
              emptyText="No welfare transactions yet."
            />
          </article>
        </section>

        {/* Sidebar */}
        <aside className="space-y-8 lg:col-span-4">
          {/* Donate Section */}
          <section className="glass-panel p-6">
            <h3 className="font-headline text-sm uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
              Donate to a Vault
            </h3>
            <form onSubmit={onDonate} className="mt-5 space-y-3">
              <select
                value={effectiveId}
                onChange={(e) => setSelectedVaultId(e.target.value)}
                className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 text-sm"
              >
                {welfareVaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} #{v.id}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Your name (or leave blank for anonymous)"
                className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 text-sm"
              />
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3"
              />
              <button
                type="submit"
                disabled={!account || isDonating}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-400/20 py-3 font-headline text-sm font-semibold text-rose-200 transition hover:bg-rose-400/30 disabled:opacity-50"
              >
                <ArrowDown size={16} /> {isDonating ? "Processing" : "Donate USDC"}
              </button>
            </form>
            {feedback && (
              <p className="mt-3 text-xs text-[var(--secondary)]" role="status">
                {feedback}
              </p>
            )}
          </section>

          {/* Who Is This For */}
          <section className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <HeartHandshake size={20} className="text-rose-300" />
              <h3 className="font-headline text-base font-semibold">Who Is This For?</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--on-surface-variant)]">
              <li>• NGOs running transparent relief campaigns</li>
              <li>• Charities needing public accountability</li>
              <li>• Community crowdfunding projects</li>
              <li>• Donors wanting verifiable impact</li>
            </ul>
          </section>

          {/* How It Works */}
          <section className="glass-panel p-6">
            <h3 className="mb-4 font-headline text-base font-semibold">How It Works</h3>
            <ol className="space-y-3 text-sm text-[var(--on-surface-variant)]">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400/20 text-[10px] font-bold text-rose-200">
                  1
                </span>
                <span>NGO creates a vault with cause description and beneficiaries</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400/20 text-[10px] font-bold text-rose-200">
                  2
                </span>
                <span>Donors contribute USDC — visible publicly on blockchain</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400/20 text-[10px] font-bold text-rose-200">
                  3
                </span>
                <span>After lock period, beneficiaries claim their allocated share directly</span>
              </li>
            </ol>
          </section>

          <BlockchainTrustBadge />
        </aside>
      </div>
    </DashboardShell>
  );
}
