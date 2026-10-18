"use client";

import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  USDC_MINT_BY_CLUSTER,
  VAULT_TREASURY_WALLET,
} from "@/lib/constants";
import { getExplorerUrl } from "@/lib/blockchain";
import { SolanaCluster, VaultFundingReceipt } from "@/lib/types";

const USDC_DECIMALS = 6;

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

export function requiresWalletFunding(cluster: SolanaCluster) {
  return cluster === "devnet" || cluster === "mainnet-beta";
}

export function getFundingModeLabel(cluster: SolanaCluster) {
  return requiresWalletFunding(cluster)
    ? "Wallet-funded USDC transfer"
    : "Testnet demo balance";
}

function usdcToBaseUnits(amountUsdc: number) {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  return BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));
}

function getSolanaProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.solana;
}

export async function requestVaultFunding({
  amountUsdc,
  cluster,
}: {
  amountUsdc: number;
  cluster: SolanaCluster;
}): Promise<VaultFundingReceipt> {
  if (!requiresWalletFunding(cluster)) {
    throw new Error("This environment is configured for simulated testnet funding.");
  }

  if (!VAULT_TREASURY_WALLET) {
    throw new Error(
      "Set NEXT_PUBLIC_VAULT_TREASURY_WALLET to a Solana treasury wallet before accepting devnet or mainnet deposits."
    );
  }

  const provider = getSolanaProvider();
  if (!provider?.signAndSendTransaction) {
    throw new Error("Install or unlock Phantom with Solana support to fund this vault.");
  }

  const { publicKey } = await provider.connect();
  const payer = new PublicKey(publicKey.toString());
  const treasury = new PublicKey(VAULT_TREASURY_WALLET);
  const mint = new PublicKey(USDC_MINT_BY_CLUSTER[cluster]);
  const connection = new Connection(clusterApiUrl(cluster), "confirmed");
  const payerAta = await getAssociatedTokenAddress(mint, payer);
  const treasuryAta = await getAssociatedTokenAddress(mint, treasury);
  const payerTokenAccount = await connection.getAccountInfo(payerAta);

  if (!payerTokenAccount) {
    throw new Error(
      `No USDC token account found for ${payer.toBase58()} on ${cluster}. Fund the wallet with USDC first.`
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: blockhash,
  });

  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      payer,
      treasuryAta,
      treasury,
      mint
    ),
    createTransferInstruction(
      payerAta,
      treasuryAta,
      payer,
      usdcToBaseUnits(amountUsdc)
    )
  );

  const { signature } = await provider.signAndSendTransaction(transaction);

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return {
    amountUsdc,
    cluster,
    payerWallet: payer.toBase58(),
    treasuryWallet: treasury.toBase58(),
    signature,
    explorerUrl: getExplorerUrl(signature, cluster),
    status: "confirmed",
  };
}
