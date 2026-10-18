"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { useUserProfile } from "@/components/auth/user-profile-provider";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { publicKey: account } = useWallet();
  const { profile, isAuthenticated } = useUserProfile();

  useEffect(() => {
    if (account && isAuthenticated && profile) {
      router.push("/dashboard");
    }
  }, [account, isAuthenticated, profile, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <ConnectWalletButton />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-[var(--primary)] md:text-5xl">
            Welcome to Luminous
          </h1>
          <p className="mt-3 text-[var(--on-surface-variant)]">
            Create your account to start managing decentralized trust vaults.
          </p>
        </div>

        <AuthGate>
          <div className="text-center text-[var(--on-surface-variant)]">
            <p>You are signed in! Redirecting to dashboard...</p>
          </div>
        </AuthGate>
      </main>
    </div>
  );
}
