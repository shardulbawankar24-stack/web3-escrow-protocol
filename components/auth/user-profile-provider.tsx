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
import { useWallet } from "@solana/wallet-adapter-react";
import { APP_NAME } from "@/lib/constants";
import { UserProfile, UserProfileInput } from "@/lib/types";

interface UserProfileContextValue {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigning: boolean;
  saveProfile: (input: UserProfileInput) => Promise<UserProfile>;
  signIn: () => Promise<UserProfile>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function sessionKey(walletAddress: string) {
  return `luminous.session.${walletAddress.toLowerCase()}`;
}

function createNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildSignInMessage({
  walletAddress,
  purpose,
}: {
  walletAddress: string;
  purpose: string;
}) {
  return [
    `${APP_NAME} wallet sign-in`,
    "",
    "Sign this message to authenticate and continue.",
    `Wallet: ${walletAddress}`,
    `Purpose: ${purpose}`,
    `Issued At: ${new Date().toISOString()}`,
    `Nonce: ${createNonce()}`,
  ].join("\n");
}

async function fetchProfile(walletAddress: string) {
  const response = await fetch(`/api/users?wallet=${encodeURIComponent(walletAddress)}`);
  if (!response.ok) {
    throw new Error("Failed to load profile.");
  }
  const payload = (await response.json()) as { profile: UserProfile | null };
  return payload.profile;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { publicKey: account } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!account?.toBase58()) {
      setProfile(null);
      setIsAuthenticated(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextProfile = await fetchProfile(account.toBase58());
      setProfile(nextProfile);
      setIsAuthenticated(
        Boolean(
          nextProfile &&
            typeof window !== "undefined" &&
            window.localStorage.getItem(sessionKey(account.toBase58()))
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!account?.toBase58()) {
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextProfile = await fetchProfile(account.toBase58());
        if (cancelled) {
          return;
        }
        setProfile(nextProfile);
        setIsAuthenticated(
          Boolean(
            nextProfile &&
              window.localStorage.getItem(sessionKey(account.toBase58()))
          )
        );
      } catch {
        if (!cancelled) {
          setProfile(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [account]);

  const saveProfile = useCallback(
    async (input: UserProfileInput) => {
      if (!account) {
        throw new Error("Connect a wallet before signing in.");
      }

      setIsSigning(true);
      try {
        const signedMessage = buildSignInMessage({
          walletAddress: account.toBase58(),
          purpose: input.purpose,
        });
        const signature = await account.signMessage({ message: signedMessage });
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            walletAddress: account.toBase58(),
            signedMessage,
            signature,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Failed to save profile.");
        }

        const payload = (await response.json()) as { profile: UserProfile };
        window.localStorage.setItem(
          sessionKey(account.toBase58()),
          JSON.stringify({
            profileId: payload.profile.id,
            signature,
            signedAt: Date.now(),
          })
        );
        setProfile(payload.profile);
        setIsAuthenticated(true);
        return payload.profile;
      } finally {
        setIsSigning(false);
      }
    },
    [account]
  );

  const signIn = useCallback(async () => {
    if (!account) {
      throw new Error("Connect a wallet before signing in.");
    }
    if (!profile) {
      throw new Error("Create your profile before signing in.");
    }

    setIsSigning(true);
    try {
      const signedMessage = buildSignInMessage({
        walletAddress: account.toBase58(),
        purpose: profile.purpose,
      });
      const signature = await account.signMessage({ message: signedMessage });
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          walletAddress: account.toBase58(),
          displayName: profile.displayName,
          email: profile.email,
          organizationName: profile.organizationName,
          purpose: profile.purpose,
          purposeDetails: profile.purposeDetails,
          signedMessage,
          signature,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to sign in.");
      }

      const payload = (await response.json()) as { profile: UserProfile };
      window.localStorage.setItem(
        sessionKey(account.toBase58()),
        JSON.stringify({
          profileId: payload.profile.id,
          signature,
          signedAt: Date.now(),
        })
      );
      setProfile(payload.profile);
      setIsAuthenticated(true);
      return payload.profile;
    } finally {
      setIsSigning(false);
    }
  }, [account, profile]);

  const signOut = useCallback(() => {
    if (account?.toBase58() && typeof window !== "undefined") {
      window.localStorage.removeItem(sessionKey(account.toBase58()));
    }
    setIsAuthenticated(false);
  }, [account]);

  const value = useMemo<UserProfileContextValue>(
    () => ({
      profile,
      isAuthenticated,
      isLoading,
      isSigning,
      saveProfile,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      profile,
      isAuthenticated,
      isLoading,
      isSigning,
      saveProfile,
      signIn,
      signOut,
      refreshProfile,
    ]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used inside UserProfileProvider");
  }
  return ctx;
}
