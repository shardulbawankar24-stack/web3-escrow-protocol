"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Users } from "lucide-react";
import { BeneficiaryShare } from "@/lib/types";
import { formatUsdc } from "@/lib/format";

interface RecipientManagerProps {
  beneficiaries: BeneficiaryShare[];
  releaseAmountUsdc?: number;
  isUnlocked: boolean;
}

export function RecipientManager({ beneficiaries, releaseAmountUsdc, isUnlocked }: RecipientManagerProps) {
  const { publicKey: account } = useWallet();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 border-b border-[rgb(62_74_63/15%)] pb-4">
        <div>
          <h4 className="font-headline font-semibold flex items-center gap-2">
            <Users size={16} /> Whitelisted Recipients
          </h4>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">
            {isUnlocked 
              ? "Lock expired. List is now immutable." 
              : "Authority can modify recipients before unlock."}
          </p>
        </div>
        <div className="text-right">
          <p className="font-headline text-lg font-bold text-indigo-300">
            {beneficiaries.length}
          </p>
          <p className="text-xs text-[var(--on-surface-variant)]">TOTAL</p>
        </div>
      </div>

      {!isUnlocked && account && (
        <button className="w-full mb-4 py-2 border border-dashed border-indigo-400/30 rounded-lg text-sm text-indigo-300 hover:bg-indigo-400/10 transition">
          + Add or Modify Recipient (Admin Only)
        </button>
      )}

      {beneficiaries.length > 0 ? (
        <div className="space-y-2">
          {beneficiaries.map((b) => (
            <div key={b.wallet} className="bg-[var(--surface-container-low)] rounded-lg p-3 flex justify-between items-center sm:text-left text-right">
              <p className="font-mono text-xs text-[var(--foreground)] truncate max-w-[150px] sm:max-w-none">
                {b.wallet}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--on-surface-variant)] border border-[var(--outline)]/20 px-2 py-1 rounded">
                  {(b.basisPoints / 100).toFixed(2)}%
                </span>
                {releaseAmountUsdc && (
                  <span className="text-sm font-headline text-emerald-300 font-bold w-20 text-right">
                    {formatUsdc((releaseAmountUsdc * b.basisPoints) / 10000)} USDC
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--on-surface-variant)] text-center py-4 bg-[var(--surface-container-low)] rounded-lg">
          No recipients whitelisted yet.
        </p>
      )}
    </div>
  );
}
