import { Connection, PublicKey } from "@solana/web3.js";
import { PENALTY_BPS } from "@/lib/constants";
import { VaultType } from "@/lib/types";

interface CreateVaultParams {
  type: VaultType;
  lockEndsAt: number;
  amountUsdc: number;
}

interface WithdrawParams {
  vault: PublicKey;
  emergencyExit?: boolean;
}

/**
 * Client-side protocol surface.
 * Replace mocked signatures with Anchor/solana-program instructions.
 */
export class SolanaEscrowClient {
  constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey
  ) {}

  async createVault(params: CreateVaultParams): Promise<string> {
    if (params.amountUsdc <= 0) {
      throw new Error("Amount must be greater than zero.");
    }

    if (params.lockEndsAt <= Date.now()) {
      throw new Error("Lock timestamp must be in the future.");
    }

    return `create-${params.type}-${Date.now()}`;
  }

  async deposit(vault: PublicKey, amountUsdc: number): Promise<string> {
    if (amountUsdc <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }

    return `deposit-${vault.toBase58().slice(0, 8)}-${Date.now()}`;
  }

  async withdraw(params: WithdrawParams): Promise<{
    signature: string;
    appliedPenaltyBps: number;
  }> {
    const appliedPenaltyBps = params.emergencyExit ? PENALTY_BPS : 0;

    return {
      signature: `withdraw-${params.vault.toBase58().slice(0, 8)}-${Date.now()}`,
      appliedPenaltyBps,
    };
  }

  async claim(vault: PublicKey): Promise<string> {
    return `claim-${vault.toBase58().slice(0, 8)}-${Date.now()}`;
  }

  getProgramInfo() {
    return {
      endpoint: this.connection.rpcEndpoint,
      programId: this.programId.toBase58(),
    };
  }
}
