"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Building2,
  CircleCheck,
  HeartHandshake,
  Landmark,
  PiggyBank,
  Plus,
  Scale,
  X,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "@/components/auth/user-profile-provider";
import { useEscrowStore } from "@/components/providers/escrow-store-provider";
import { BPS_DENOMINATOR, DEFAULT_AAVE_APY, VAULT_OPTIONS } from "@/lib/constants";
import { formatUsdc, shortenAddress } from "@/lib/format";
import {
  getFundingModeLabel,
  requestVaultFunding,
  requiresWalletFunding,
} from "@/lib/solana-payments";
import { BeneficiaryShare, VaultType } from "@/lib/types";

const iconByType: Record<VaultType, typeof PiggyBank> = {
  saver: PiggyBank,
  ngo: HeartHandshake,
  welfare: HeartHandshake,
  dispensation: Building2,
};

const accentByType: Record<VaultType, string> = {
  saver: "border-emerald-400",
  ngo: "border-rose-400",
  welfare: "border-amber-400",
  dispensation: "border-sky-400",
};

function normalizeShare(percent: number) {
  return Math.max(1, Math.min(100, Number.isFinite(percent) ? percent : 1));
}

export function CreateVaultBuilder() {
  const router = useRouter();
  const { publicKey: account } = useWallet();
  const { profile } = useUserProfile();
  const { createVault, selectedCluster } = useEscrowStore();
  const [selectedType, setSelectedType] = useState<VaultType>("saver");
  const [name, setName] = useState("Personal Savings 2026");
  const [amountUsdc, setAmountUsdc] = useState(50000);
  const [durationDays, setDurationDays] = useState(90);
  const [useAaveYield, setUseAaveYield] = useState(false);
  const [aaveLockDays, setAaveLockDays] = useState(90);
  const [description, setDescription] = useState("");
  const [cadence, setCadence] = useState<"monthly" | "weekly">("monthly");
  const [releaseAmount, setReleaseAmount] = useState(100);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryShare[]>([]);
  const [newBeneficiary, setNewBeneficiary] = useState("");
  const [newSharePercent, setNewSharePercent] = useState(100);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didApplyProfilePurpose, setDidApplyProfilePurpose] = useState(false);

  const selected = useMemo(
    () => VAULT_OPTIONS.find((option) => option.type === selectedType),
    [selectedType]
  );
  const totalBps = useMemo(
    () => beneficiaries.reduce((sum, beneficiary) => sum + beneficiary.basisPoints, 0),
    [beneficiaries]
  );
  const totalPercent = totalBps / 100;
  const projectedAaveInterest = useAaveYield
    ? (amountUsdc * DEFAULT_AAVE_APY * Math.max(aaveLockDays, 1)) / 36500
    : 0;

  const needsBeneficiaries = selectedType === "ngo" || selectedType === "welfare" || selectedType === "dispensation";
  const needsDescription = selectedType === "ngo" || selectedType === "welfare";
  const needsWalletFunding = requiresWalletFunding(selectedCluster);

  useEffect(() => {
    if (!profile || didApplyProfilePurpose) {
      return;
    }

    if (profile.purpose === "welfare_fund") {
      setSelectedType("ngo");
      setName(`NGO / Welfare Vault ${new Date().getFullYear()}`);
    }
    if (profile.purpose === "salary_dispensation") {
      setSelectedType("dispensation");
      setName(`Dispensation Vault ${new Date().getFullYear()}`);
    }
    setDidApplyProfilePurpose(true);
  }, [didApplyProfilePurpose, profile]);

  function addBeneficiary() {
    const wallet = newBeneficiary.trim();
    if (!wallet || beneficiaries.some((beneficiary) => beneficiary.wallet === wallet)) {
      return;
    }

    setBeneficiaries([
      ...beneficiaries,
      { wallet, basisPoints: Math.round(normalizeShare(newSharePercent) * 100) },
    ]);
    setNewBeneficiary("");
  }

  function removeBeneficiary(target: string) {
    setBeneficiaries(beneficiaries.filter((beneficiary) => beneficiary.wallet !== target));
  }

  function updateBeneficiaryShare(wallet: string, percent: number) {
    setBeneficiaries((items) =>
      items.map((beneficiary) =>
        beneficiary.wallet === wallet
          ? { ...beneficiary, basisPoints: Math.round(normalizeShare(percent) * 100) }
          : beneficiary
      )
    );
  }

  function equalizeBeneficiaries() {
    if (beneficiaries.length === 0) {
      return;
    }
    const equal = Math.floor(BPS_DENOMINATOR / beneficiaries.length);
    setBeneficiaries((items) =>
      items.map((beneficiary, index) => ({
        ...beneficiary,
        basisPoints:
          index === items.length - 1 ? BPS_DENOMINATOR - equal * (items.length - 1) : equal,
      }))
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      setFeedback("Please connect your wallet first.");
      return;
    }
    if (needsBeneficiaries && beneficiaries.length === 0) {
      setFeedback("This vault type requires at least one beneficiary.");
      return;
    }
    if ((selectedType === "ngo" || selectedType === "welfare") && totalBps !== BPS_DENOMINATOR) {
      setFeedback("Beneficiary shares must add up to exactly 100%.");
      return;
    }

    setIsSubmitting(true);
    try {
      const funding = needsWalletFunding
        ? await requestVaultFunding({
            amountUsdc,
            cluster: selectedCluster,
          })
        : undefined;
      const created = createVault({
        name,
        type: selectedType,
        amountUsdc,
        durationDays,
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : undefined,
        ownerWallet: funding?.payerWallet ?? account.toBase58(),
        useAaveYield: selectedType === "saver" && useAaveYield,
        aaveLockDays,
        description: description.trim() || undefined,
        cadence: selectedType === "dispensation" ? cadence : undefined,
        releaseAmountUsdc: selectedType === "dispensation" ? releaseAmount : undefined,
        creatorProfileId: profile?.id,
        funding,
      });
      setFeedback(
        funding?.explorerUrl
          ? `Vault #${created.id} created. USDC funding confirmed on Solana.`
          : `Vault #${created.id} created successfully on ${selectedCluster}.`
      );
      router.push(`/vaults/${created.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create vault.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VAULT_OPTIONS.map((option) => {
          const Icon = iconByType[option.type];
          const active = selectedType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                setSelectedType(option.type);
                setName(`${option.title} ${new Date().getFullYear()}`);
                setUseAaveYield(false);
                setBeneficiaries([]);
                setDescription("");
                setFeedback(null);
              }}
              className={clsx(
                "group relative flex h-full flex-col rounded-lg border-2 p-6 text-left transition-all",
                active
                  ? `${accentByType[option.type]} bg-[var(--surface-container-high)] shadow-[0_0_40px_-18px_rgba(110,229,145,0.2)]`
                  : "border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]"
              )}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-container-highest)] text-[var(--primary)]">
                <Icon size={24} />
              </div>
              <h3 className="font-headline text-lg font-bold tracking-tight">{option.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--on-surface-variant)]">
                {option.description}
              </p>
              <ul className="mt-4 space-y-1.5">
                {option.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[11px]">
                    <CircleCheck size={13} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                    <span className="text-[var(--on-surface-variant)]">{bullet}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </section>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="rounded-lg border border-[rgb(62_74_63/15%)] bg-[var(--surface-container)] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">Vault Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                {selectedType === "ngo" || selectedType === "welfare" ? "Initial Donation (USDC)" : "Deposit Amount (USDC)"}
              </label>
              <input
                type="number"
                min={1}
                value={amountUsdc}
                onChange={(event) => setAmountUsdc(Number(event.target.value))}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Lock Duration (Days)
              </label>
              <input
                type="number"
                min={7}
                max={365}
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {needsDescription && (
            <div className="mt-4">
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Cause / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this fund (visible to all donors publicly)..."
                rows={3}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          )}

          {selectedType === "dispensation" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                  Release Cadence
                </label>
                <select 
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as "monthly" | "weekly")}
                  className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                  Release Amount per Recipient (USDC)
                </label>
                <input
                  type="number"
                  min={1}
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {selectedType === "saver" ? (
            <div className="mt-6 rounded-lg border border-[rgb(62_74_63/18%)] bg-[var(--surface-container-low)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-container-highest)] text-[var(--primary)]">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-semibold">Aave USDC Interest Lock</h3>
                    <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
                      Queue locked saver funds for an Aave supply adapter and show projected stablecoin yield.
                    </p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={useAaveYield}
                    onChange={(event) => setUseAaveYield(event.target.checked)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  Enabled
                </label>
              </div>
              {useAaveYield ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                      Aave Lock Days
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={365}
                      value={aaveLockDays}
                      onChange={(event) => setAaveLockDays(Number(event.target.value))}
                      className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container)] px-4 py-3 outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="rounded-lg bg-[var(--surface-container-highest)] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--outline)]">
                      Projected interest
                    </p>
                    <p className="mt-2 font-headline text-2xl font-bold">
                      {formatUsdc(projectedAaveInterest)} USDC
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedType === "saver" && (
            <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-200">⚡ 5% Discipline Mechanism</p>
              <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                If you withdraw before the lock period ends, a 5% penalty is applied and redistributed
                to other disciplined savers. This creates financial incentive to stay committed.
              </p>
            </div>
          )}

          {needsBeneficiaries && (
            <div className="mt-6 rounded-lg border border-[rgb(62_74_63/18%)] bg-[var(--surface-container-low)] p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-headline text-xl font-semibold">
                    {selectedType === "dispensation" ? "Recipient Wallets" : "Beneficiary Allocation"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
                    {selectedType === "dispensation"
                      ? "Add wallet addresses of recipients who will claim funds after unlock."
                      : "Shares must total 100% before the vault can be initialized."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={equalizeBeneficiaries}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgb(62_74_63/25%)] px-3 py-2 text-sm text-[var(--secondary)]"
                >
                  <Scale size={15} />
                  Equalize
                </button>
              </div>
              <div className="space-y-3">
                {beneficiaries.map((beneficiary) => (
                  <div
                    key={beneficiary.wallet}
                    className="grid gap-3 rounded-lg bg-[var(--surface-container)] p-3 sm:grid-cols-[1fr_120px_36px]"
                  >
                    <p className="min-w-0 truncate font-mono text-sm text-[var(--foreground)]">
                      {shortenAddress(beneficiary.wallet)}
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={beneficiary.basisPoints / 100}
                      onChange={(event) =>
                        updateBeneficiaryShare(beneficiary.wallet, Number(event.target.value))
                      }
                      className="rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeBeneficiary(beneficiary.wallet)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-200 hover:bg-red-500/10"
                      aria-label="Remove beneficiary"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_44px]">
                <input
                  type="text"
                  value={newBeneficiary}
                  onChange={(event) => setNewBeneficiary(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addBeneficiary();
                    }
                  }}
                  placeholder="Solana wallet address"
                  className="rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newSharePercent}
                  onChange={(event) => setNewSharePercent(Number(event.target.value))}
                  className="rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={addBeneficiary}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--on-primary)]"
                  aria-label="Add beneficiary"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-container-highest)]">
                <div
                  className={clsx(
                    "h-full transition-all",
                    totalBps === BPS_DENOMINATOR ? "bg-[var(--primary)]" : "bg-amber-300"
                  )}
                  style={{ width: `${Math.min(totalPercent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--on-surface-variant)]">
                Allocated {totalPercent.toFixed(2)}% of 100%.
              </p>
            </div>
          )}

          {selectedType === "dispensation" && (
            <div className="mt-4 rounded-lg border border-sky-300/20 bg-sky-400/5 p-4">
              <p className="text-sm font-semibold text-sky-200">🏛️ Dispensation Rules</p>
              <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                Funds are locked by the authority. No emergency withdraw is possible.
                Recipients can claim their share only after the lock period ends.
                You can modify recipients before the lock expires.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!account || isSubmitting}
            className="mt-6 w-full rounded-full gradient-bg py-4 font-headline text-lg font-bold text-[var(--on-primary)] neon-shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? needsWalletFunding
                ? "Waiting for Wallet Transaction"
                : "Creating Vault"
              : account
                ? `Initialize ${selected?.title ?? "Vault"}`
                : "Connect Wallet to Continue"}
          </button>
          {feedback ? (
            <p className="mt-4 text-sm text-[var(--secondary)]" role="status">
              {feedback}
            </p>
          ) : null}
        </section>

        <aside className="rounded-lg border border-[rgb(62_74_63/15%)] bg-[var(--surface-container-low)] p-5">
          <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--primary)]">
            Execution Preview
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Network</dt>
              <dd className="text-right uppercase">{selectedCluster}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Funding</dt>
              <dd className="text-right">{getFundingModeLabel(selectedCluster)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Vault Type</dt>
              <dd className="text-right capitalize">{selectedType}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Principal</dt>
              <dd className="text-right">{formatUsdc(amountUsdc)} USDC</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Beneficiaries</dt>
              <dd className="text-right">{beneficiaries.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Emergency Withdraw</dt>
              <dd className="text-right">
                {selectedType === "saver" ? (
                  <span className="text-amber-200">5% penalty</span>
                ) : (
                  <span className="text-red-300">Not available</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--on-surface-variant)]">Aave mode</dt>
              <dd className="text-right">{selectedType === "saver" && useAaveYield ? "Queued" : "Off"}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-[var(--surface-container)] p-4 text-sm text-[var(--on-surface-variant)]">
            <p>
              {needsWalletFunding
                ? "Devnet and mainnet creation requires a Phantom USDC transfer before the vault is recorded."
                : "Testnet uses demo USDC balances for product walkthroughs."}
            </p>
            <p className="mt-2 text-xs text-[var(--outline)]">
              {selectedType === "saver" && "Early exit triggers 5% penalty redistributed to disciplined savers."}
              {selectedType === "ngo" && "Donors and beneficiaries are publicly visible on blockchain."}
              {selectedType === "welfare" && "Fund distribution is transparent and verifiable by anyone."}
              {selectedType === "dispensation" && "Funds release only after lock — no early withdrawal possible."}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
