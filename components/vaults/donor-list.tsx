"use client";

import { Heart, User } from "lucide-react";
import { formatUsdc, shortenAddress } from "@/lib/format";
import { DonorRecord } from "@/lib/types";

interface DonorListProps {
  donors: DonorRecord[];
  targetUsdc?: number;
  totalRaisedUsdc: number;
}

export function DonorList({ donors, targetUsdc, totalRaisedUsdc }: DonorListProps) {
  const progressPercent = targetUsdc && targetUsdc > 0
    ? Math.min((totalRaisedUsdc / targetUsdc) * 100, 100)
    : 100;

  return (
    <div>
      {targetUsdc && targetUsdc > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-end justify-between text-sm">
            <span className="text-[var(--on-surface-variant)]">
              Raised <span className="font-headline font-bold text-[var(--primary)]">{formatUsdc(totalRaisedUsdc)}</span>
            </span>
            <span className="text-[var(--on-surface-variant)]">
              Goal <span className="font-headline font-bold">{formatUsdc(targetUsdc)}</span> USDC
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-container-highest)]">
            <div
              className="h-full rounded-full gradient-bg shadow-[0_0_12px_rgba(110,229,145,0.5)] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-[var(--outline)]">
            {progressPercent.toFixed(1)}% funded
          </p>
        </div>
      )}

      {donors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgb(62_74_63/30%)] bg-[var(--surface-container-low)] p-6 text-center text-sm text-[var(--on-surface-variant)]">
          No donations recorded yet. Be the first to contribute!
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[var(--outline)]">
            <Heart size={12} />
            <span>{donors.length} Verified Donor{donors.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="mb-2 grid items-center gap-3 px-3 text-[10px] uppercase tracking-[0.12em] text-[var(--outline)] sm:grid-cols-[1fr_1fr_120px_140px]">
            <span>Donor</span>
            <span>Wallet</span>
            <span className="sm:text-right">Amount</span>
            <span className="sm:text-right">Date</span>
          </div>
          {donors.map((donor, idx) => {
            const displayName = donor.donorName || "Anonymous";
            const isAnonymous = !donor.donorName;

            return (
              <div
                key={`${donor.wallet}-${idx}`}
                className="grid items-center gap-3 rounded-lg bg-[var(--surface-container-low)] p-3 sm:grid-cols-[1fr_1fr_120px_140px]"
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isAnonymous ? "bg-[var(--surface-container-highest)]" : "bg-emerald-400/15"}`}>
                    <User size={13} className={isAnonymous ? "text-[var(--outline)]" : "text-emerald-300"} />
                  </div>
                  <span className={`text-sm font-medium ${isAnonymous ? "italic text-[var(--outline)]" : "text-[var(--foreground)]"}`}>
                    {displayName}
                  </span>
                </div>
                <p className="truncate font-mono text-xs text-[var(--outline)]">
                  {shortenAddress(donor.wallet)}
                </p>
                <p className="font-headline text-lg font-bold text-[var(--primary)] sm:text-right">
                  {formatUsdc(donor.amountUsdc)}
                  <span className="ml-1 text-xs font-normal text-[var(--outline)]">USDC</span>
                </p>
                <p className="text-xs text-[var(--outline)] sm:text-right">
                  {new Date(donor.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
