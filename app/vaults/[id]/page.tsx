"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Landmark, Lock, Send, Users } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { TransparencyLog } from "@/components/protocol/transparency-log";
import { CountdownTimer } from "@/components/vaults/countdown-timer";
import { DonorList } from "@/components/vaults/donor-list";
import { RecipientManager } from "@/components/vaults/recipient-manager";
import { formatUsdc, getTimeLeft } from "@/lib/format";
import { requestVaultFunding, requiresWalletFunding } from "@/lib/solana-payments";

export default function VaultDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { publicKey: account } = useWallet();
  const { vaults, auditLogs, selectedCluster, createVault, withdraw, claim } = useEscrowStore();

  const vault = useMemo(
    () => vaults.find((item) => item.id === params.id),
    [vaults, params.id]
  );

  const [newAmount, setNewAmount] = useState(50000);
  const [duration, setDuration] = useState(90);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!vault) {
    return (
      <DashboardShell title="Vault Not Found">
        <p className="text-[var(--on-surface-variant)]">Vault #{params.id} does not exist.</p>
      </DashboardShell>
    );
  }

  const activeVault = vault;
  const runtime = getTimeLeft(activeVault.lockEndsAt, now);
  const runtimeStatus =
    runtime.isUnlocked && activeVault.status === "active" ? "unlocked" : activeVault.status;
  const canClaim = runtimeStatus === "unlocked";
  const penaltyPreview = newAmount * 0.05;
  const returnPreview = newAmount - penaltyPreview;
  const vaultLogs = auditLogs.filter((log) => log.vaultId === activeVault.id);

  async function createFromHere(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      setFeedback("Please connect your wallet first.");
      return;
    }
    setIsCreating(true);
    try {
      const funding = requiresWalletFunding(selectedCluster)
        ? await requestVaultFunding({
            amountUsdc: newAmount,
            cluster: selectedCluster,
          })
        : undefined;
      const created = createVault({
        name: `Personal Vault ${new Date().getFullYear()}`,
        type: "saver",
        amountUsdc: newAmount,
        durationDays: duration,
        ownerWallet: funding?.payerWallet ?? account.toBase58(),
        funding,
      });
      setFeedback(`Vault #${created.id} created.`);
      router.push(`/vaults/${created.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create vault.");
    } finally {
      setIsCreating(false);
    }
  }

  function emergencyExit() {
    if (!account) {
      setFeedback("Please connect your wallet first.");
      return;
    }
    try {
      const tx = withdraw(activeVault.id, activeVault.principalUsdc, true, account.toBase58());
      setFeedback(
        `Emergency withdraw successful: ${formatUsdc(tx.netAmountUsdc)} USDC returned, ${formatUsdc(tx.penaltyUsdc)} USDC slashed.`
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to withdraw.");
    }
  }

  function claimVault() {
    if (!account) {
      setFeedback("Please connect your wallet first.");
      return;
    }
    try {
      const tx = claim(activeVault.id, account.toBase58());
      setFeedback(`Claimed ${formatUsdc(tx.netAmountUsdc)} USDC from vault #${activeVault.id}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Claim failed.");
    }
  }

  return (
    <DashboardShell
      title={`${activeVault.name} #${activeVault.id}`}
      subtitle={`${runtimeStatus.toUpperCase()} ESCROW • ${activeVault.strategyLabel.toUpperCase()} • ${selectedCluster.toUpperCase()}`}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="glass-panel relative overflow-hidden p-8 lg:col-span-8">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Locked Amount
              </p>
              <p className="mt-4 font-headline text-6xl font-bold tracking-tighter text-[var(--primary)] md:text-8xl">
                {formatUsdc(activeVault.principalUsdc)}
                <span className="ml-3 text-3xl text-[var(--foreground)]">USDC</span>
              </p>
              {activeVault.explorerUrl && (
                <a
                  href={activeVault.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm text-[var(--primary)] hover:underline"
                >
                  View Creation Transaction on Explorer
                </a>
              )}
            </div>
            <span className="rounded-full border border-[var(--secondary)]/20 bg-[var(--surface-container)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--secondary)]">
              {runtimeStatus}
            </span>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <CountdownTimer targetTs={activeVault.lockEndsAt} />
          {activeVault.type === 'saver' && (
            <div className="rounded-[24px] bg-[var(--surface-container-low)] p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Projected Reward Share
              </p>
              <p className="mt-4 font-headline text-6xl font-bold">
                +{activeVault.projectedApy.toFixed(1)}%
                <span className="ml-2 text-lg text-[var(--outline)]">APY</span>
              </p>
              <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                Generated from early withdrawal penalties across protocol pools.
              </p>
            </div>
          )}
          {(activeVault.type === 'welfare' || activeVault.type === 'ngo') && activeVault.targetUsdc && (
            <div className="rounded-[24px] bg-[var(--surface-container-low)] p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Funding Progress
              </p>
              <p className="mt-4 font-headline text-6xl font-bold">
                {Math.round((activeVault.principalUsdc / activeVault.targetUsdc) * 100)}%
                <span className="ml-2 text-lg text-[var(--outline)]">funded</span>
              </p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[var(--surface-container-highest)]">
                <div 
                  className="h-full rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(110,229,145,0.6)]" 
                  style={{ width: `${Math.min(100, (activeVault.principalUsdc / activeVault.targetUsdc) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                Goal: {formatUsdc(activeVault.targetUsdc)} USDC
              </p>
            </div>
          )}
          {activeVault.type === 'dispensation' && (
            <div className="rounded-[24px] bg-[var(--surface-container-low)] p-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Scheduled Payout
              </p>
              <p className="mt-4 font-headline text-6xl font-bold">
                {formatUsdc(activeVault.releaseAmountUsdc || 0)}
                <span className="ml-2 text-lg text-[var(--outline)]">USDC</span>
              </p>
              <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                per claiming recipient ({activeVault.whitelistCount || activeVault.beneficiaries?.length || 0} whitelisted)
              </p>
            </div>
          )}
          </div>
        </section>

        <section className="glass-panel flex flex-col p-8 lg:col-span-4">
          <h3 className="font-headline text-3xl font-semibold">
            {activeVault.type === 'saver' ? "Accumulated Rewards" : "Total Locked"}
          </h3>
          <p className="mt-6 font-headline text-6xl font-bold">
            {formatUsdc(activeVault.type === 'saver' ? activeVault.accumulatedRewardsUsdc : activeVault.principalUsdc)}
          </p>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">USDC</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-container-highest)]">
            <div className="h-full w-[40%] rounded-full gradient-bg shadow-[0_0_12px_rgba(110,229,145,0.6)]" />
          </div>
          <button
            type="button"
            disabled={!canClaim || !account}
            onClick={claimVault}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-[var(--surface-variant)] py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lock size={18} />
            {activeVault.type === 'saver' ? "Claim Full Amount + Rewards" : "Claim Available Allocation"}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--outline)]">
            {canClaim ? "Ready to claim now" : "Claim unlocks when timer completes"}
          </p>
        </section>

        <section className="rounded-lg border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-lowest)] p-6 lg:col-span-6">
          <div className="mb-5 flex items-center gap-3">
            <Users className="text-[var(--primary)]" size={22} />
            <div>
              <h3 className="font-headline text-2xl font-semibold">
                {activeVault.type === 'dispensation' ? 'Recipients' : 
                 activeVault.type === 'saver' ? 'Beneficiaries & Welfare' : 'Donors & Beneficiaries'}
              </h3>
              <p className="text-sm text-[var(--on-surface-variant)]">
                {activeVault.type === 'dispensation' 
                  ? 'Authority can modify recipients before payout.' 
                  : 'Claim shares are transparent and auditable before release.'}
              </p>
            </div>
          </div>
          
          {(activeVault.type === 'welfare' || activeVault.type === 'ngo') && activeVault.donors && (
            <div className="mb-6 border-b border-[rgb(62_74_63/15%)] pb-6">
              <h4 className="mb-3 text-sm font-headline uppercase tracking-[0.1em] text-[var(--on-surface-variant)]">
                Donors List
              </h4>
              <DonorList donors={activeVault.donors} totalRaisedUsdc={activeVault.principalUsdc} targetUsdc={activeVault.targetUsdc} />
            </div>
          )}

          {activeVault.type === 'dispensation' ? (
            <RecipientManager 
              beneficiaries={activeVault.beneficiaries || []} 
              releaseAmountUsdc={activeVault.releaseAmountUsdc} 
              isUnlocked={canClaim} 
            />
          ) : activeVault.beneficiaries?.length ? (
            <div className="space-y-3">
              <h4 className="mb-3 text-sm font-headline uppercase tracking-[0.1em] text-[var(--on-surface-variant)]">
                Distributions
              </h4>
              {activeVault.beneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.wallet}
                  className="grid gap-3 rounded-lg bg-[var(--surface-container-low)] p-4 sm:grid-cols-[1fr_120px]"
                >
                  <p className="truncate font-mono text-sm">{beneficiary.wallet}</p>
                  <p className="text-left font-headline text-lg text-[var(--secondary)] sm:text-right">
                    {(beneficiary.basisPoints / 100).toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-[var(--surface-container-low)] p-4 text-sm text-[var(--on-surface-variant)]">
              This vault pays back to the owner wallet only.
            </p>
          )}
          {activeVault.releaseAmountUsdc && activeVault.type !== 'dispensation' ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--surface-container-low)] p-4 text-sm text-[var(--secondary)]">
              <Send size={16} />
              Scheduled welfare release: {formatUsdc(activeVault.releaseAmountUsdc)} USDC per recipient.
            </div>
          ) : null}
        </section>

        {activeVault.type === 'saver' && (
          <section className="rounded-lg border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-lowest)] p-6 lg:col-span-6">
            <div className="mb-5 flex items-center gap-3">
              <Landmark className="text-[var(--primary)]" size={22} />
              <div>
                <h3 className="font-headline text-2xl font-semibold">Yield Lock</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Saver funds can be queued for the Aave supply adapter.
                </p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-[var(--surface-container-low)] p-4">
                <dt className="text-[var(--on-surface-variant)]">Aave mode</dt>
                <dd className="mt-2 font-headline text-xl">{activeVault.useAaveYield ? "Enabled" : "Disabled"}</dd>
              </div>
              <div className="rounded-lg bg-[var(--surface-container-low)] p-4">
                <dt className="text-[var(--on-surface-variant)]">Adapter status</dt>
                <dd className="mt-2 font-headline text-xl capitalize">
                  {activeVault.aaveStatus?.replace("_", " ") ?? "not enabled"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-[var(--outline)]">
              Aave runs on its supported EVM markets, so this Solana vault records the supply intent until a bridge or
              adapter signer is connected.
            </p>
          </section>
        )}

        <section className="rounded-[24px] border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-lowest)] p-8 lg:col-span-7">
          <h3 className="font-headline text-4xl font-semibold tracking-tight">Create New Vault</h3>
          <form onSubmit={createFromHere} className="mt-8 space-y-8">
            <div>
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Deposit Amount (USDC)
              </label>
              <input
                type="number"
                min={1}
                value={newAmount}
                onChange={(event) => setNewAmount(Number(event.target.value))}
                className="w-full rounded-[24px] border border-transparent bg-[var(--surface-container-low)] px-6 py-4 text-3xl font-headline outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <div className="mb-3 flex items-end justify-between">
                <label className="text-sm text-[var(--on-surface-variant)]">Lock Duration</label>
                <span className="font-headline text-2xl">{duration} Days</span>
              </div>
              <input
                type="range"
                min={7}
                max={365}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-container-highest)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(110,229,145,0.5)]"
              />
              <div className="mt-2 flex justify-between text-xs text-[var(--outline)]">
                <span>7 D</span>
                <span>180 D</span>
                <span>365 D</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!account || isCreating}
              className="flex w-full items-center justify-center gap-2 rounded-full gradient-bg py-4 font-headline text-lg font-bold text-[var(--on-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Processing" : account ? "Initialize Vault" : "Connect Wallet"}
              {account && <ArrowRight size={18} />}
            </button>
          </form>
        </section>

        {activeVault.type === 'saver' && (
          <section className="relative overflow-hidden rounded-[24px] border-l-4 border-red-400 bg-[var(--surface-container-low)] p-8 lg:col-span-5">
            <div className="mb-4 flex items-center gap-2 text-red-300">
              <AlertTriangle size={20} />
              <h3 className="font-headline text-2xl font-semibold">Emergency Exit</h3>
            </div>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Breaking vault lock triggers 5% protocol slash on principal. Slashed funds
              are redistributed as discipline yield.
            </p>
            <div className="mt-6 rounded-[20px] bg-[var(--surface-container-highest)] p-4 text-sm">
              <p className="flex justify-between py-1">
                <span>Principal</span>
                <span>{formatUsdc(newAmount)} USDC</span>
              </p>
              <p className="flex justify-between py-1 text-red-300">
                <span>Penalty (5%)</span>
                <span>-{formatUsdc(penaltyPreview)} USDC</span>
              </p>
              <div className="my-2 h-px bg-[rgb(62_74_63/20%)]" />
              <p className="flex justify-between py-1 font-semibold">
                <span>Return Amount</span>
                <span>{formatUsdc(returnPreview)} USDC</span>
              </p>
            </div>
            <button
              type="button"
              disabled={!account}
              onClick={emergencyExit}
              className="mt-6 flex w-full justify-center rounded-xl bg-red-500/10 py-3 font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-30"
            >
              Confirm Slashing Exit
            </button>
          </section>
        )}

        {/* Conditionally hide logs for dispensation unless they are the owner */}
        {(activeVault.type !== "dispensation" || (activeVault.type === "dispensation" && account?.toBase58() && activeVault.ownerWallet && account.toBase58().toLowerCase() === activeVault.ownerWallet.toLowerCase())) && (
          <section className="glass-panel p-8 lg:col-span-12">
            <div className="mb-6">
              <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
                Transparency Logs
              </p>
              <h3 className="mt-2 font-headline text-3xl font-semibold">Vault Transaction Trail</h3>
            </div>
            <TransparencyLog logs={vaultLogs} emptyText="No transactions have been recorded for this vault yet." />
          </section>
        )}
      </div>
      {feedback ? (
        <p className="mt-6 text-sm text-[var(--secondary)]" role="status">
          {feedback}
        </p>
      ) : null}
    </DashboardShell>
  );
}
