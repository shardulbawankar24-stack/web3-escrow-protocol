"use client";

import { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { useUserProfile } from "@/components/auth/user-profile-provider";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { EnvironmentSwitcher } from "@/components/protocol/environment-switcher";
import { shortenAddress } from "@/lib/format";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  const { publicKey: account } = useWallet();
  const { profile, isAuthenticated, signOut } = useUserProfile();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <main className="w-full p-6 md:ml-64 lg:p-12">
        <header className="mb-12 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-6xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-base text-[color:var(--on-surface-variant)] md:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EnvironmentSwitcher />
            {account && isAuthenticated && profile ? (
              <div className="rounded-full bg-[rgb(45_52_73/20%)] px-5 py-2.5 backdrop-blur-md">
                <span className="font-headline text-sm">{profile.displayName}</span>
                <span className="ml-2 text-xs text-[var(--outline)]">
                  {shortenAddress(account.toBase58())}
                </span>
              </div>
            ) : null}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-[rgb(62_74_63/20%)] px-4 py-2.5 font-headline text-xs text-[var(--on-surface-variant)] transition hover:text-[var(--foreground)]"
              >
                Sign Out
              </button>
            ) : null}
            <ConnectWalletButton />
          </div>
        </header>
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
