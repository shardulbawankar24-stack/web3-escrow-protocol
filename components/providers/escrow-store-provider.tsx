"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BPS_DENOMINATOR,
  DEFAULT_AAVE_APY,
  PENALTY_BPS,
  PROGRAM_ID,
  SOLANA_CLUSTER,
  resolveCluster,
} from "@/lib/constants";
import {
  createSimulatedSignature,
  getExplorerUrl,
  inferTransactionStatus,
} from "@/lib/blockchain";
import { seededRewardHistory, seededVaults } from "@/lib/seed";
import {
  CreateVaultInput,
  DashboardMetrics,
  DonorRecord,
  RewardPoolPoint,
  SolanaCluster,
  TransactionKind,
  TransactionResult,
  TransparencyLogRecord,
  VaultFundingReceipt,
  VaultRecord,
  VaultStatus,
} from "@/lib/types";

interface EscrowState {
  baselineTvlUsdc: number;
  vaults: VaultRecord[];
  rewardHistory: RewardPoolPoint[];
  auditLogs: TransparencyLogRecord[];
  selectedCluster: SolanaCluster;
}

interface EscrowStoreContextValue {
  vaults: VaultRecord[];
  rewardHistory: RewardPoolPoint[];
  auditLogs: TransparencyLogRecord[];
  selectedCluster: SolanaCluster;
  metrics: DashboardMetrics;
  setSelectedCluster: (cluster: SolanaCluster) => void;
  createVault: (input: CreateVaultInput) => VaultRecord;
  deposit: (
    id: string,
    amountUsdc: number,
    wallet?: string,
    donorName?: string,
    funding?: VaultFundingReceipt
  ) => TransactionResult;
  withdraw: (
    id: string,
    amountUsdc: number,
    emergencyExit?: boolean,
    wallet?: string
  ) => TransactionResult;
  claim: (id: string, wallet?: string) => TransactionResult;
  getVaultsByType: (type: VaultRecord["type"] | VaultRecord["type"][]) => VaultRecord[];
  getDonors: (vaultId: string) => DonorRecord[];
}

const initialState: EscrowState = {
  baselineTvlUsdc: seededVaults.reduce((sum, vault) => sum + vault.principalUsdc, 0),
  vaults: seededVaults,
  rewardHistory: seededRewardHistory,
  auditLogs: [],
  selectedCluster: resolveCluster(SOLANA_CLUSTER),
};

const EscrowStoreContext = createContext<EscrowStoreContextValue | null>(null);

function upsertHistory(history: RewardPoolPoint[], amount: number): RewardPoolPoint[] {
  if (amount <= 0) {
    return history;
  }

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });
  const cloned = [...history];
  const idx = cloned.findIndex((point) => point.month === currentMonth);

  if (idx === -1) {
    const capped = cloned.slice(Math.max(0, cloned.length - 6));
    capped.push({ month: currentMonth, value: amount });
    return capped;
  }

  cloned[idx] = { ...cloned[idx], value: cloned[idx].value + amount };
  return cloned;
}

function validateBeneficiaries(input: CreateVaultInput) {
  if (input.type !== "ngo" && input.type !== "welfare" && input.type !== "dispensation") {
    return;
  }

  if (!input.beneficiaries?.length) {
    throw new Error("This vault type requires at least one beneficiary.");
  }

  if (input.type !== "dispensation") {
    const totalBps = input.beneficiaries.reduce((sum, item) => sum + item.basisPoints, 0);
    if (totalBps !== BPS_DENOMINATOR) {
      throw new Error("Beneficiary shares must add up to 100%.");
    }
  }
}

function strategyFor(input: CreateVaultInput) {
  if (input.type === "ngo") {
    return "Milestone Release";
  }

  if (input.type === "welfare") {
    return "Transparent Welfare Split";
  }

  if (input.type === "dispensation") {
    return "Automated Payroll";
  }

  return input.useAaveYield ? "Aave USDC Interest Lock" : "High-Yield Lock";
}

function makeLog(params: {
  vaultId: string;
  kind: TransactionKind;
  cluster: SolanaCluster;
  amountUsdc: number;
  netAmountUsdc?: number;
  penaltyUsdc?: number;
  fromWallet?: string;
  toWallet?: string;
  memo: string;
  signature?: string;
  explorerUrl?: string;
  status?: TransparencyLogRecord["status"];
}): TransparencyLogRecord {
  const signature = params.signature ?? createSimulatedSignature(params.kind);
  const status = params.status ?? inferTransactionStatus(PROGRAM_ID);

  return {
    id: `${params.kind}-${Date.now()}-${signature.slice(0, 8)}`,
    vaultId: params.vaultId,
    kind: params.kind,
    status,
    cluster: params.cluster,
    signature,
    explorerUrl:
      params.explorerUrl ??
      (status === "confirmed" ? getExplorerUrl(signature, params.cluster) : undefined),
    amountUsdc: params.amountUsdc,
    netAmountUsdc: params.netAmountUsdc ?? params.amountUsdc,
    penaltyUsdc: params.penaltyUsdc ?? 0,
    fromWallet: params.fromWallet,
    toWallet: params.toWallet,
    memo: params.memo,
    createdAt: Date.now(),
  };
}

function persistVault(vault: VaultRecord) {
  void fetch("/api/vaults", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vault),
  }).catch(() => undefined);
}

function persistLogs(logs: TransparencyLogRecord[]) {
  if (logs.length === 0) {
    return;
  }

  void fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logs }),
  }).catch(() => undefined);
}

export function EscrowStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EscrowState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [vaultResponse, logResponse] = await Promise.all([
          fetch("/api/vaults"),
          fetch("/api/transactions"),
        ]);

        if (cancelled) {
          return;
        }

        const vaultPayload = vaultResponse.ok ? await vaultResponse.json() : null;
        const logPayload = logResponse.ok ? await logResponse.json() : null;

        setState((prev) => ({
          ...prev,
          vaults:
            Array.isArray(vaultPayload?.vaults) && vaultPayload.vaults.length > 0
              ? vaultPayload.vaults
              : prev.vaults,
          auditLogs: Array.isArray(logPayload?.logs) ? logPayload.logs : prev.auditLogs,
        }));
      } catch {
        // Keep the seeded local simulator available if the backend is not running.
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedCluster = useCallback((cluster: SolanaCluster) => {
    setState((prev) => ({ ...prev, selectedCluster: cluster }));
  }, []);

  const appendLogs = useCallback((logs: TransparencyLogRecord[]) => {
    setState((prev) => ({ ...prev, auditLogs: [...logs, ...prev.auditLogs] }));
    persistLogs(logs);
  }, []);

  const createVault = useCallback(
    (input: CreateVaultInput) => {
      if (!input.name.trim()) {
        throw new Error("Vault name is required.");
      }
      if (input.amountUsdc <= 0) {
        throw new Error("Deposit amount must be greater than zero.");
      }
      if (input.durationDays < 7) {
        throw new Error("Minimum lock duration is 7 days.");
      }
      if (input.useAaveYield && input.type !== "saver") {
        throw new Error("Aave interest locking is only available for saver vaults.");
      }

      validateBeneficiaries(input);

      const generatedId = Math.random().toString(36).slice(2, 8).toUpperCase();
      const beneficiaryCount = input.beneficiaries?.length ?? 0;
      const ownerWallet = input.funding?.payerWallet ?? input.ownerWallet ?? "Connected Wallet";

      const created: VaultRecord = {
        id: generatedId,
        name: input.name.trim(),
        type: input.type,
        status: "active",
        strategyLabel: strategyFor(input),
        lockEndsAt: Date.now() + input.durationDays * 24 * 60 * 60 * 1000,
        principalUsdc: input.amountUsdc,
        ownerWallet,
        accumulatedRewardsUsdc: 0,
        rewardPoolUsdc: 0,
        projectedApy: input.useAaveYield ? DEFAULT_AAVE_APY : input.type === "saver" ? 6.4 : 0,
        useAaveYield: Boolean(input.useAaveYield),
        aaveLockDays: input.useAaveYield ? input.aaveLockDays ?? input.durationDays : undefined,
        aaveStatus: input.useAaveYield ? "queued" : "not_enabled",
        targetUsdc: input.type === "ngo" ? input.amountUsdc * 2 : undefined,
        beneficiaries: input.beneficiaries,
        whitelistCount:
          input.type === "welfare" || input.type === "dispensation" ? Math.max(beneficiaryCount, 50) : undefined,
        releaseAmountUsdc:
          input.type === "welfare" && beneficiaryCount > 0
            ? input.amountUsdc / beneficiaryCount
            : input.type === "dispensation" && beneficiaryCount > 0
              ? input.amountUsdc / beneficiaryCount
              : undefined,
        cadence: input.type === "dispensation" ? "monthly" : input.type === "welfare" ? "weekly" : undefined,
        description: input.description,
        creationSignature: input.funding?.signature,
        explorerUrl: input.funding?.explorerUrl,
        donors:
          input.type === "ngo" || input.type === "welfare"
            ? [
                {
                  wallet: ownerWallet,
                  amountUsdc: input.amountUsdc,
                  timestamp: Date.now(),
                },
              ]
            : undefined,
      };

      const logs = [
        makeLog({
          vaultId: created.id,
          kind: "create_vault",
          cluster: state.selectedCluster,
          amountUsdc: input.amountUsdc,
          fromWallet: ownerWallet,
          memo: `${created.type} vault initialized with USDC principal`,
        }),
      ];

      if (input.funding) {
        logs.unshift(
          makeLog({
            vaultId: created.id,
            kind: "deposit",
            cluster: input.funding.cluster,
            amountUsdc: input.funding.amountUsdc,
            fromWallet: input.funding.payerWallet,
            toWallet: input.funding.treasuryWallet,
            signature: input.funding.signature,
            explorerUrl: input.funding.explorerUrl,
            status: input.funding.status,
            memo: `Initial wallet-funded USDC deposit for ${created.name}`,
          })
        );
      }

      if (created.useAaveYield) {
        logs.push(
          makeLog({
            vaultId: created.id,
            kind: "aave_supply",
            cluster: state.selectedCluster,
            amountUsdc: input.amountUsdc,
            fromWallet: ownerWallet,
            memo: "Saver funds queued for Aave USDC supply integration",
          })
        );
      }

      setState((prev) => ({ ...prev, vaults: [created, ...prev.vaults] }));
      appendLogs(logs);
      persistVault(created);

      return created;
    },
    [appendLogs, state.selectedCluster]
  );

  const deposit = useCallback(
    (
      id: string,
      amountUsdc: number,
      wallet?: string,
      donorName?: string,
      funding?: VaultFundingReceipt
    ) => {
      if (amountUsdc <= 0) {
        throw new Error("Deposit amount must be greater than zero.");
      }

      const vault = state.vaults.find((item) => item.id === id);
      if (!vault) {
        throw new Error("Vault not found.");
      }
      if (vault.status === "claimed" || vault.status === "closed") {
        throw new Error("Cannot deposit into a closed vault.");
      }

      const isCharityVault = vault.type === "ngo" || vault.type === "welfare";

      const log = makeLog({
        vaultId: id,
        kind: "deposit",
        cluster: state.selectedCluster,
        amountUsdc,
        fromWallet: funding?.payerWallet ?? wallet,
        toWallet: funding?.treasuryWallet,
        signature: funding?.signature,
        explorerUrl: funding?.explorerUrl,
        status: funding?.status,
        memo: isCharityVault
          ? `Donation of ${amountUsdc} USDC recorded for ${vault.name}`
          : `USDC deposit recorded for ${vault.name}`,
      });

      const newDonor: DonorRecord | undefined =
        isCharityVault && (funding?.payerWallet ?? wallet)
          ? {
              wallet: funding?.payerWallet ?? wallet ?? "Connected Wallet",
              amountUsdc,
              timestamp: Date.now(),
              donorName,
            }
          : undefined;
      const updatedVault: VaultRecord = {
        ...vault,
        principalUsdc: vault.principalUsdc + amountUsdc,
        donors: newDonor ? [...(vault.donors ?? []), newDonor] : vault.donors,
      };

      setState((prev) => ({
        ...prev,
        vaults: prev.vaults.map((item) => (item.id === id ? updatedVault : item)),
      }));
      appendLogs([log]);
      persistVault(updatedVault);

      return {
        id,
        netAmountUsdc: amountUsdc,
        penaltyUsdc: 0,
        signature: log.signature,
        explorerUrl: log.explorerUrl,
        status: log.status,
      };
    },
    [appendLogs, state.selectedCluster, state.vaults]
  );

  const withdraw = useCallback(
    (
      id: string,
      amountUsdc: number,
      emergencyExit = false,
      wallet?: string
    ): TransactionResult => {
      if (amountUsdc <= 0) {
        throw new Error("Withdraw amount must be greater than zero.");
      }

      const vault = state.vaults.find((item) => item.id === id);
      if (!vault) {
        throw new Error("Vault not found.");
      }
      if (amountUsdc > vault.principalUsdc) {
        throw new Error("Withdraw amount exceeds available principal.");
      }

      // Emergency withdraw is ONLY allowed for saver vaults
      if (emergencyExit && vault.type !== "saver") {
        throw new Error(
          "Emergency withdraw is only available for Saver's Vault. " +
          "NGO, Welfare, and Dispensation vaults release funds only after the lock period ends."
        );
      }

      // Dispensation vaults cannot withdraw at all — workers claim after unlock
      if (vault.type === "dispensation") {
        throw new Error(
          "Dispensation vault funds cannot be withdrawn. Recipients claim after the lock period ends."
        );
      }

      const shouldPenalty =
        emergencyExit &&
        vault.type === "saver" &&
        vault.status === "active" &&
        Date.now() < vault.lockEndsAt;
      const penaltyUsdc = shouldPenalty ? (amountUsdc * PENALTY_BPS) / BPS_DENOMINATOR : 0;
      const netAmountUsdc = amountUsdc - penaltyUsdc;
      const rewardReceivers = state.vaults.filter(
        (item) => item.id !== id && item.type === "saver" && item.status === "active"
      );
      const rewardPrincipal = rewardReceivers.reduce((sum, item) => sum + item.principalUsdc, 0);

      const log = makeLog({
        vaultId: id,
        kind: "withdraw",
        cluster: state.selectedCluster,
        amountUsdc,
        netAmountUsdc,
        penaltyUsdc,
        toWallet: wallet,
        memo: shouldPenalty
          ? "Emergency exit applied 5% saver penalty and redistributed rewards"
          : "USDC withdrawal completed without penalty",
      });

      setState((prev) => ({
        ...prev,
        vaults: prev.vaults.map((item) => {
          if (item.id === id) {
            const nextPrincipal = Math.max(0, item.principalUsdc - amountUsdc);
            return {
              ...item,
              principalUsdc: nextPrincipal,
              rewardPoolUsdc:
                rewardReceivers.length === 0 ? item.rewardPoolUsdc + penaltyUsdc : item.rewardPoolUsdc,
              status: nextPrincipal === 0 ? "closed" : item.status,
            };
          }

          if (penaltyUsdc > 0 && rewardPrincipal > 0 && rewardReceivers.some((receiver) => receiver.id === item.id)) {
            const share = (item.principalUsdc / rewardPrincipal) * penaltyUsdc;
            return { ...item, accumulatedRewardsUsdc: item.accumulatedRewardsUsdc + share };
          }

          return item;
        }),
        rewardHistory: upsertHistory(prev.rewardHistory, penaltyUsdc),
      }));
      appendLogs([log]);

      return {
        id,
        netAmountUsdc,
        penaltyUsdc,
        signature: log.signature,
        explorerUrl: log.explorerUrl,
        status: log.status,
      };
    },
    [appendLogs, state.selectedCluster, state.vaults]
  );

  const claim = useCallback(
    (id: string, wallet?: string): TransactionResult => {
      const vault = state.vaults.find((item) => item.id === id);
      if (!vault) {
        throw new Error("Vault not found.");
      }
      if (vault.status === "active" && Date.now() < vault.lockEndsAt) {
        throw new Error("Vault is still locked.");
      }

      const netAmountUsdc = vault.principalUsdc + vault.rewardPoolUsdc + vault.accumulatedRewardsUsdc;
      const primaryLog = makeLog({
        vaultId: id,
        kind: "claim",
        cluster: state.selectedCluster,
        amountUsdc: netAmountUsdc,
        netAmountUsdc,
        toWallet: wallet,
        memo: `Claimed principal and rewards from ${vault.name}`,
      });

      const beneficiaryLogs =
        vault.beneficiaries?.map((beneficiary) =>
          makeLog({
            vaultId: id,
            kind: "beneficiary_release",
            cluster: state.selectedCluster,
            amountUsdc: (netAmountUsdc * beneficiary.basisPoints) / BPS_DENOMINATOR,
            toWallet: beneficiary.wallet,
            memo: `Beneficiary received ${(beneficiary.basisPoints / 100).toFixed(2)}% share`,
          })
        ) ?? [];

      setState((prev) => ({
        ...prev,
        vaults: prev.vaults.map((item) =>
          item.id === id
            ? {
                ...item,
                principalUsdc: 0,
                rewardPoolUsdc: 0,
                accumulatedRewardsUsdc: 0,
                aaveStatus: item.useAaveYield ? "withdrawable" : item.aaveStatus,
                status: "claimed" as VaultStatus,
              }
            : item
        ),
      }));
      appendLogs([primaryLog, ...beneficiaryLogs]);

      return {
        id,
        netAmountUsdc,
        penaltyUsdc: 0,
        signature: primaryLog.signature,
        explorerUrl: primaryLog.explorerUrl,
        status: primaryLog.status,
      };
    },
    [appendLogs, state.selectedCluster, state.vaults]
  );

  const vaults = useMemo(() => state.vaults, [state.vaults]);

  const getVaultsByType = useCallback(
    (type: VaultRecord["type"] | VaultRecord["type"][]) => {
      const types = Array.isArray(type) ? type : [type];
      return vaults.filter((vault) => types.includes(vault.type));
    },
    [vaults]
  );

  const getDonors = useCallback(
    (vaultId: string): DonorRecord[] => {
      const vault = vaults.find((item) => item.id === vaultId);
      return vault?.donors ?? [];
    },
    [vaults]
  );

  const metrics = useMemo<DashboardMetrics>(() => {
    const totalValueLockedUsdc = vaults.reduce(
      (sum, vault) => sum + (vault.status === "claimed" ? 0 : vault.principalUsdc),
      0
    );
    const totalRewardsUsdc = vaults.reduce(
      (sum, vault) => sum + vault.rewardPoolUsdc + vault.accumulatedRewardsUsdc,
      0
    );
    const activeVaultCount = vaults.filter((vault) => vault.status === "active").length;
    const weeklyGrowthPercent =
      state.baselineTvlUsdc === 0
        ? 0
        : ((totalValueLockedUsdc - state.baselineTvlUsdc) / state.baselineTvlUsdc) * 100;

    return {
      totalValueLockedUsdc,
      weeklyGrowthPercent,
      totalRewardsUsdc,
      activeVaultCount,
    };
  }, [state.baselineTvlUsdc, vaults]);



  const value = useMemo<EscrowStoreContextValue>(
    () => ({
      vaults,
      rewardHistory: state.rewardHistory,
      auditLogs: state.auditLogs,
      selectedCluster: state.selectedCluster,
      metrics,
      setSelectedCluster,
      createVault,
      deposit,
      withdraw,
      claim,
      getVaultsByType,
      getDonors,
    }),
    [
      vaults,
      state.rewardHistory,
      state.auditLogs,
      state.selectedCluster,
      metrics,
      setSelectedCluster,
      createVault,
      deposit,
      withdraw,
      claim,
      getVaultsByType,
      getDonors,
    ]
  );

  return <EscrowStoreContext.Provider value={value}>{children}</EscrowStoreContext.Provider>;
}

export function useEscrowStore() {
  const ctx = useContext(EscrowStoreContext);
  if (!ctx) {
    throw new Error("useEscrowStore must be used inside EscrowStoreProvider");
  }
  return ctx;
}
