# Restructure LUMINOUS into 3 Distinct Vault Sections with Trust-First Transparency

## Background

The current project mixes all vault types (Saver, Welfare, NGO) together in a single dashboard and vault listing. This makes it confusing — each vault type serves a fundamentally different user group with different needs. The project's **core USP is TRUST through blockchain transparency**, so every section must prominently show on-chain data.

## User Review Required

> [!IMPORTANT]
> **Vault Type Rename**: The current codebase uses `"enterprise"` for the Dispensation/Government vault type. This plan renames it to `"dispensation"` throughout the codebase (types, seed data, constants, DB). Is that acceptable, or should we keep `"enterprise"` as the internal key?

> [!IMPORTANT]
> **Emergency Withdraw Restriction**: Currently, the emergency withdraw (5% penalty) is available on ALL vault detail pages. Per your requirements, it will be restricted to **Saver's Vault only**. NGO/Welfare and Dispensation vaults will NOT have emergency withdraw. Confirmed?   -> as the funds will be shared to beneficieries after the duration is over ok

> [!WARNING]
> **Dispensation Vault Modifications**: You mentioned the government/authority should be able to "make changes before time is over." What specific changes should be allowed? This plan assumes:
> - Modify beneficiary wallet addresses (before unlock)
> - Modify release amounts per recipient (before unlock)
> - Add/remove whitelisted recipients (before unlock)
> - **Cannot** withdraw funds early or change lock duration
> 
> Please confirm or clarify.  -> no they cant make any changes

## Open Questions

> [!IMPORTANT]
> 1. **Donor Display for Welfare/NGO**: Should donors be shown by wallet address with the amount they donated? Or anonymized? Currently, deposit logs exist but aren't surfaced as a "donors list."    -> so the thing is we will take names and detailed at inital stage like signin page when someone will satrt use our service so who is present i our service database thier name will shown up , otherwise the wallet address -> donating for who want to donate anonyously as we are taking the people who are donating through our service ok
> 2. **Dispensation Lock Behavior**: When the government deposits, do workers claim individually after unlock, or is there an automatic distribution? This plan assumes **workers claim individually** after the lock period ends.  -> the end users will claim the funds/salary as automatic dispencing of funds will create load on chain so individual claiming is better option , and the logs of government deposits should be private to organizatio members only not to everyone (as we are keeping the personal vault to self , ngo and welfare anyone can see logs or info about transactoonal data and all, and for government organsation who are just sending data logs can be seen by organization members only so we have to make sure we are taking enough info from the user to what is intention to use our services ok )
> 3. **Branding**: Should the app name stay "LUMINOUS" or change? -> keep it lumious do not change

---

## Proposed Changes

### 1. Types & Constants

#### [MODIFY] [types.ts](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/lib/types.ts)
- Add `"dispensation"` to `VaultType` union (replace `"enterprise"`)
- Add `DonorRecord` interface: `{ wallet: string; amountUsdc: number; timestamp: number }`
- Add `donors?: DonorRecord[]` to `VaultRecord`
- Add `description?: string` to `VaultRecord` (for NGO/Welfare cause description)
- Update `EnterpriseVaultDetail` → `DispensationVaultDetail`

#### [MODIFY] [constants.ts](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/lib/constants.ts)
- Replace `"enterprise"` with `"dispensation"` in `VAULT_OPTIONS`
- Add a **Dispensation Vault** option to `VAULT_OPTIONS` with appropriate description and bullets
- Update vault option descriptions to match the 3 user groups clearly

#### [MODIFY] [seed.ts](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/lib/seed.ts)
- Add a seeded dispensation vault (Government salary batch)
- Update existing seed data to have proper descriptions
- Add seeded donor data for the NGO vault

#### [MODIFY] [mock-data.ts](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/lib/mock-data.ts)
- Update enterprise references to dispensation
- Add donor mock data

---

### 2. Landing Page Redesign

#### [MODIFY] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/page.tsx) (Home)
- Redesign the "Purpose-Built Vaults" section into **3 prominent, distinctly-styled cards**:
  - 🏦 **Saver's Vault** — Personal finance, piggy bank, discipline rewards → links to `/savers`
  - 💚 **Welfare / NGO Vault** — Transparent crowdfunding, charity → links to `/welfare`  
  - 🏛️ **Dispensation Vault** — Government/enterprise automated payments → links to `/dispensation`
- Each card has its own color accent, icon, and description of who it's for
- Add a **"Trust Through Transparency"** section highlighting blockchain verification
- Add "How It Works" flow for each vault type

---

### 3. New Route Pages (3 Separate Sections)

#### [NEW] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/savers/page.tsx)
- **Saver's Vault Dashboard** — Shows only `type === "saver"` vaults
- Features: Create saver vault, view saver vaults, deposit, **emergency withdraw with 5% penalty**
- Shows reward pool chart (penalties redistributed to disciplined savers)
- Transparency logs filtered to saver vaults
- Section-specific metrics (TVL for savers, reward pool, active saver vaults)

#### [NEW] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/welfare/page.tsx)
- **Welfare / NGO Vault Dashboard** — Shows only `type === "ngo" || type === "welfare"` vaults
- Features: Create welfare/NGO vault, **donor list display**, **beneficiary management**, deposit (as donation)
- **NO emergency withdraw** — funds release only after lock period
- Shows donors list with wallet + amount
- Shows beneficiaries with allocation percentages
- Transparency logs filtered to welfare/NGO vaults
- Prominent "Verified on Blockchain" badge

#### [NEW] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/dispensation/page.tsx)
- **Dispensation Vault Dashboard** — Shows only `type === "dispensation"` vaults
- Features: Create dispensation vault, **modify beneficiaries before lock expires**, view payment schedule
- **NO emergency withdraw** — government deposits, workers claim after lock period
- Authority can modify recipient wallets and amounts before unlock
- Shows whitelisted recipients and their scheduled payouts
- Transparency logs filtered to dispensation vaults
- "Public Verification" section showing all data is on-chain

#### [NEW] [layout.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/savers/layout.tsx)
#### [NEW] [layout.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/welfare/layout.tsx)  
#### [NEW] [layout.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/dispensation/layout.tsx)
- Each with section-specific metadata (title, description) for SEO

---

### 4. Vault Detail Page Updates

#### [MODIFY] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/vaults/%5Bid%5D/page.tsx)
- **Conditional rendering** based on vault type:
  - **Saver**: Show emergency exit section, reward pool share, Aave yield lock
  - **NGO/Welfare**: Show donors list, beneficiaries, donation progress bar, NO emergency exit
  - **Dispensation**: Show recipient management (modifiable before unlock), payment schedule, NO emergency exit
- Each type gets a distinct color accent header
- **Blockchain transparency logs** remain visible on ALL vault detail pages (trust USP)

---

### 5. Sidebar Navigation Update

#### [MODIFY] [sidebar-nav.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/layout/sidebar-nav.tsx)
- Replace generic nav with section-based navigation:
  ```
  ── Dashboard (overview)
  ── Saver's Vault
  ── Welfare / NGO Vault
  ── Dispensation Vault
  ── Create Vault
  ── Transparency Logs
  ```

---

### 6. Escrow Store Updates

#### [MODIFY] [escrow-store-provider.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/providers/escrow-store-provider.tsx)
- Add `addDonor()` method — records a donor when someone deposits into NGO/welfare vault
- Add `modifyDispensationRecipients()` method — allows authority to change recipients before unlock
- **Restrict `withdraw()` with emergency exit** — only allow for `type === "saver"` vaults
  - Throw error if emergency exit attempted on NGO/welfare/dispensation vaults
- Add `getDonors(vaultId)` computed method
- Track donors in vault state

---

### 7. Create Vault Builder Updates

#### [MODIFY] [create-vault-builder.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/vaults/create-vault-builder.tsx)
- Show all 4 vault type cards (saver, ngo, welfare, dispensation)
- For **Dispensation**: Add fields for recipient wallets, cadence (monthly/weekly), and release amount
- For **NGO/Welfare**: Add description/cause field, emphasize donor tracking
- For **Saver**: Keep existing Aave yield toggle + emphasize 5% discipline mechanism

---

### 8. New Components

#### [NEW] [donor-list.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/vaults/donor-list.tsx)
- Displays list of donors: wallet address, amount donated, timestamp
- Used in Welfare/NGO vault detail pages
- Shows total raised vs target

#### [NEW] [blockchain-trust-badge.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/protocol/blockchain-trust-badge.tsx)
- Reusable component showing "Verified on Solana Blockchain" with explorer links
- Displays cluster, program ID, and verification status
- Used on every section page to reinforce trust

#### [NEW] [recipient-manager.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/components/vaults/recipient-manager.tsx)
- For Dispensation vaults: allows authority to add/remove/modify whitelisted recipients before lock expiry
- Shows scheduled payout per recipient
- Disabled/readonly after lock period ends

---

### 9. Dashboard Page Updates

#### [MODIFY] [page.tsx](file:///home/nyxeos/Documents/Fun%20Projects/edifinal/app/dashboard/page.tsx)
- Becomes an **overview dashboard** showing aggregated metrics across all vault types
- Quick links to each section (Savers, Welfare, Dispensation)
- Section breakdown cards showing TVL per vault type
- Remove the generic "Emergency Withdraw" button from here
- Keep transparency logs (all types)

---

## Verification Plan

### Automated Tests
```bash
npm run build
```
- Verify all new routes compile without errors
- Verify type safety with TypeScript compilation

### Manual Verification
- Navigate to each new section page (`/savers`, `/welfare`, `/dispensation`)
- Verify emergency withdraw only appears on saver vault detail pages
- Verify donor list displays on welfare/NGO vault detail pages
- Verify dispensation vault allows recipient modification before lock
- Verify transparency logs appear on every section
- Verify sidebar navigation has all 3 sections
- Verify landing page shows 3 distinct vault type cards
- Test create vault flow for each type
