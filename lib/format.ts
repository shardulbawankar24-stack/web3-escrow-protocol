import { VaultRecord, VaultStatus } from "@/lib/types";

const usdcFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsdc(value: number): string {
  return usdcFormatter.format(value);
}

export function shortenAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function resolveVaultStatus(vault: VaultRecord, now = Date.now()): VaultStatus {
  if (vault.status === "claimed" || vault.status === "closed") {
    return vault.status;
  }
  return now >= vault.lockEndsAt ? "unlocked" : "active";
}

export function getTimeLeft(targetTs: number, now = Date.now()) {
  const ms = Math.max(0, targetTs - now);
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes, isUnlocked: ms <= 0 };
}
