"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        disabled
        className="rounded-full bg-[var(--surface-container-high)] px-5 py-3 font-headline text-sm font-semibold text-[var(--on-surface-variant)] opacity-75"
        style={{ height: 50, minWidth: 165 }}
      >
        Loading...
      </button>
    ),
  }
);

export function ConnectWalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full bg-[var(--surface-container-high)] px-5 py-3 font-headline text-sm font-semibold text-[var(--on-surface-variant)] opacity-75"
        style={{ height: 50, minWidth: 165 }}
      >
        Connect Wallet
      </button>
    );
  }

  return <WalletMultiButtonDynamic style={{ borderRadius: "9999px" }} />;
}
