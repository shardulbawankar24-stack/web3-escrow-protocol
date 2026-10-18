# Luminous Escrow (Solana + USDC)

Solana-first decentralized time-locked escrow UI for:
- **Saver Vault**: personal discipline savings with 5% early-exit slash and reward redistribution.
- **NGO Vault**: public fundraising with beneficiary basis-point claims.
- **Enterprise Vault**: recurring transparent distributions for payroll/welfare scenarios.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Solana Wallet Adapter (`@solana/wallet-adapter-*`)
- Recharts for dashboard analytics
- Protocol client stubs ready for Anchor integration (`lib/protocol.ts`)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Routes
- `/` landing page
- `/dashboard` protocol overview dashboard
- `/vaults` vault list
- `/vaults/[id]` vault detail view
- `/create-vault` vault creation wizard UI

## Solana Configuration

- Devnet USDC mint is configured by default.
- Set `NEXT_PUBLIC_PROGRAM_ID` to your deployed Anchor/Solana program.
- `lib/protocol.ts` exposes typed client methods (`createVault`, `deposit`, `withdraw`, `claim`) for wiring transactions to on-chain instructions.

## Protocol Rules Enforced in UX

1. USDC-only denomination.
2. Pull-based claims after unlock.
3. 5% saver emergency exit slash redistributed to loyal lockers.

## Next Milestone

- Replace mocked protocol signatures in `lib/protocol.ts` with Anchor instruction builders and transaction send flows.
- Add indexing layer for vault discovery (Helius/Triton custom indexer, or equivalent).
