import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateVaultBuilder } from "@/components/vaults/create-vault-builder";

export default function CreateVaultPage() {
  return (
    <DashboardShell
      title="Create Vault"
      subtitle="Initialize a secure smart contract-backed vault on Solana."
    >
      <CreateVaultBuilder />
    </DashboardShell>
  );
}
