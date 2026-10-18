import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { EscrowStoreProvider } from "@/components/providers/escrow-store-provider";
import { UserProfileProvider } from "@/components/auth/user-profile-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUMINOUS | Decentralized Trust Vaults on Solana",
  description:
    "Decentralized USDC vaults for personal savings, transparent charity, and automated payments — powered by Solana blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <EscrowStoreProvider>
          <WalletProvider>
            <UserProfileProvider>
              {children}
            </UserProfileProvider>
          </WalletProvider>
        </EscrowStoreProvider>
      </body>
    </html>
  );
}
