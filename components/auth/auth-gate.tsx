"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import clsx from "clsx";
import { Building2, HeartHandshake, PiggyBank, ShieldCheck } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useUserProfile } from "@/components/auth/user-profile-provider";
import { UserProfileInput, UserPurpose } from "@/lib/types";
import { shortenAddress } from "@/lib/format";

const purposeOptions: Array<{
  id: UserPurpose;
  title: string;
  body: string;
  icon: typeof PiggyBank;
}> = [
  {
    id: "saving_money",
    title: "Saving Money",
    body: "Create personal time-locked USDC vaults and build discipline.",
    icon: PiggyBank,
  },
  {
    id: "welfare_fund",
    title: "Welfare / NGO Funds",
    body: "Collect donations publicly and distribute to beneficiaries.",
    icon: HeartHandshake,
  },
  {
    id: "salary_dispensation",
    title: "Salary Dispensation",
    body: "Lock payroll or public funds for scheduled worker claims.",
    icon: Building2,
  },
];

function defaultDisplayName(walletAddress: string) {
  return `User ${shortenAddress(walletAddress)}`;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { publicKey: account } = useWallet();
  const {
    profile,
    isAuthenticated,
    isLoading,
    isSigning,
    saveProfile,
    signIn,
  } = useUserProfile();
  const [purpose, setPurpose] = useState<UserPurpose>("saving_money");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [purposeDetails, setPurposeDetails] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedPurpose = useMemo(
    () => purposeOptions.find((option) => option.id === purpose) ?? purposeOptions[0],
    [purpose]
  );

  if (account && isAuthenticated && profile) {
    return <>{children}</>;
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      return;
    }

    const input: UserProfileInput = {
      displayName: displayName.trim() || defaultDisplayName(account.toBase58()),
      email: email.trim() || undefined,
      organizationName: organizationName.trim() || undefined,
      purpose,
      purposeDetails: purposeDetails.trim() || undefined,
    };

    try {
      setFeedback("Confirm the sign-in message in your wallet.");
      await saveProfile(input);
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Profile sign-up failed.");
    }
  }

  async function submitSignIn() {
    try {
      setFeedback("Confirm the sign-in message in your wallet.");
      await signIn();
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Sign-in failed.");
    }
  }

  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-[rgb(62_74_63/18%)] bg-[var(--surface-container-lowest)] p-6 shadow-2xl shadow-black/20 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="font-headline text-3xl font-bold">Sign In To Continue</h2>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
            Wallet signature is required before vault data, funding actions, and dashboard tools are available.
          </p>
        </div>
      </div>

      {!account ? (
        <div className="rounded-lg border border-dashed border-[rgb(62_74_63/30%)] bg-[var(--surface-container-low)] p-6">
          <p className="mb-4 text-sm text-[var(--on-surface-variant)]">
            Connect a Solana wallet to start sign-in or create a profile.
          </p>
          <ConnectWalletButton />
        </div>
      ) : isLoading ? (
        <div className="rounded-lg bg-[var(--surface-container-low)] p-6 text-sm text-[var(--on-surface-variant)]">
          Loading profile for {shortenAddress(account.toBase58())}...
        </div>
      ) : profile ? (
        <div className="rounded-lg border border-[rgb(62_74_63/18%)] bg-[var(--surface-container-low)] p-6">
          <p className="font-headline text-xl font-semibold">{profile.displayName}</p>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
            {shortenAddress(profile.walletAddress)} is registered for{" "}
            {purposeOptions.find((option) => option.id === profile.purpose)?.title ?? "LUMINOUS"}.
          </p>
          <button
            type="button"
            onClick={submitSignIn}
            disabled={isSigning}
            className="mt-5 rounded-full gradient-bg px-6 py-3 font-headline text-sm font-bold text-[var(--on-primary)] disabled:opacity-50"
          >
            {isSigning ? "Waiting for Signature" : "Sign In With Wallet"}
          </button>
        </div>
      ) : (
        <form onSubmit={submitProfile} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {purposeOptions.map((option) => {
              const Icon = option.icon;
              const active = purpose === option.id;
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setPurpose(option.id)}
                  className={clsx(
                    "rounded-lg border p-4 text-left transition",
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[rgb(62_74_63/18%)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]"
                  )}
                >
                  <Icon className="mb-3 text-[var(--primary)]" size={22} />
                  <p className="font-headline text-lg font-semibold">{option.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--on-surface-variant)]">
                    {option.body}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Name
              </label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={defaultDisplayName(account.toBase58())}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="optional"
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Organization
              </label>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder={
                  purpose === "saving_money"
                    ? "optional"
                    : "NGO, government office, company, DAO, or institution"
                }
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-[var(--on-surface-variant)]">
                Purpose Details
              </label>
              <textarea
                value={purposeDetails}
                onChange={(event) => setPurposeDetails(event.target.value)}
                rows={3}
                placeholder={`Tell us how you plan to use ${selectedPurpose.title.toLowerCase()}.`}
                className="w-full rounded-lg border border-[rgb(62_74_63/20%)] bg-[var(--surface-container-low)] px-4 py-3 outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigning}
            className="rounded-full gradient-bg px-7 py-3 font-headline text-sm font-bold text-[var(--on-primary)] disabled:opacity-50"
          >
            {isSigning ? "Waiting for Signature" : "Sign Up With Wallet"}
          </button>
        </form>
      )}

      {feedback ? (
        <p className="mt-4 text-sm text-[var(--secondary)]" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
