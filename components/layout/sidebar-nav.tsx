"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Activity,
  Building2,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  PiggyBank,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

import { useWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "@/components/auth/user-profile-provider";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { shortenAddress } from "@/lib/format";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/savers", label: "Saver's Vault", icon: PiggyBank },
  { href: "/welfare", label: "Welfare / NGO", icon: HeartHandshake },
  { href: "/dispensation", label: "Dispensation", icon: Building2 },
  { href: "/create-vault", label: "Create Vault", icon: PlusCircle },
  { href: "/vaults", label: "All Vaults", icon: ShieldCheck },
];

const footerItems = [
  { href: "#", label: "Docs", icon: FileText },
  { href: "#", label: "Status", icon: Activity },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) {
    return pathname === href.split("#")[0];
  }
  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();
  const { publicKey: account } = useWallet();
  const { profile, isAuthenticated } = useUserProfile();

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col rounded-r-lg border-r border-[rgb(62_74_63/18%)] bg-[var(--surface-container-lowest)]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-md md:flex">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,229,145,0.9)]" />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-black italic tracking-tight text-[var(--primary)]">
            LUMINOUS
          </h2>
          <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-[var(--outline)]">
            Trust Vault Protocol
          </p>
        </div>
      </Link>

      <div className="mb-3">
        <p className="px-4 font-headline text-[9px] uppercase tracking-[0.25em] text-[var(--outline)]">
          Vault Sections
        </p>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-full px-4 py-3 font-headline text-[10px] font-semibold uppercase tracking-[0.2em] transition-all",
                active
                  ? "bg-[var(--primary)]/15 text-[var(--primary)] shadow-[0_0_15px_rgba(102,224,163,0.2)]"
                  : "text-[var(--outline)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {account && isAuthenticated && profile ? (
          <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-4 text-center">
            <p className="mb-1 font-headline text-[10px] uppercase tracking-widest text-[var(--primary)]">
              Signed In
            </p>
            <p className="mb-1 truncate font-headline text-sm font-bold text-[var(--foreground)]">
              {profile.displayName}
            </p>
            <p className="font-mono text-sm font-bold text-[var(--foreground)]">
              {shortenAddress(account.toBase58())}
            </p>
          </div>
        ) : (
          <ConnectWalletButton />
        )}
      </div>

      <div className="mt-6 space-y-1 border-t border-[rgb(62_74_63/18%)] pt-4">
        {footerItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-full px-4 py-2 font-headline text-[10px] uppercase tracking-[0.2em] text-[var(--outline)] transition-colors hover:text-[var(--foreground)]"
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
