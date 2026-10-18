import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { SolanaCluster, TransactionKind, TransactionStatus } from "@/lib/types";

export function getExplorerUrl(signature: string, cluster: SolanaCluster) {
  const clusterParam = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}

export function createSimulatedSignature(kind: TransactionKind) {
  void kind;
  const entropy = new Uint8Array(64);

  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(entropy);
  } else {
    for (let i = 0; i < entropy.length; i += 1) {
      entropy[i] = Math.floor(Math.random() * 256);
    }
  }

  return bs58.encode(entropy);
}

export function inferTransactionStatus(programId: string): TransactionStatus {
  try {
    new PublicKey(programId);
  } catch {
    return "simulated";
  }

  return "simulated";
}
