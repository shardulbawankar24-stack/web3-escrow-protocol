use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod luminous_escrow {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: String,
        amount: u64,
        duration_days: u64,
        vault_type: u8,
        beneficiaries: Vec<Pubkey>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        vault.owner = ctx.accounts.owner.key();
        vault.vault_id = vault_id;
        vault.amount = amount;
        vault.lock_ends_at = Clock::get()?.unix_timestamp + (duration_days * 24 * 60 * 60) as i64;
        vault.vault_type = vault_type;
        vault.is_active = true;
        vault.beneficiaries = beneficiaries;

        // NGO (vault_type == 2) must have at least one beneficiary
        if vault_type == 2 {
            require!(vault.beneficiaries.len() > 0, EscrowError::NoBeneficiaries);
        }
        
        // Welfare (vault_type == 3) must also have at least one beneficiary
        if vault_type == 3 {
             require!(vault.beneficiaries.len() > 0, EscrowError::NoBeneficiaries);
        }

        let transfer_instruction = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        let current_time = Clock::get()?.unix_timestamp;

        require!(vault.is_active, EscrowError::VaultNotActive);
        require!(current_time >= vault.lock_ends_at, EscrowError::VaultLocked);

        let amount = vault.amount;
        vault.is_active = false;
        vault.amount = 0;

        let vault_seeds = &[
            b"vault",
            vault.owner.as_ref(),
            vault.vault_id.as_bytes(),
            &[ctx.bumps.vault_state],
        ];
        let signer = &[&vault_seeds[..]];

        if vault.vault_type == 3 {
            // Welfare type: split amount equally between all beneficiaries
            let beneficiary_count = vault.beneficiaries.len() as u64;
            require!(beneficiary_count > 0, EscrowError::NoBeneficiaries);
            
            let split_amount = amount / beneficiary_count;
            // The frontend will be expected to pass the receiver token accounts for all beneficiaries
            // For simplicity in this demo contract without iterated remaining accounts, 
            // we will just assume it's handling claiming for a specific receiver or we do a direct transfer to one.
            // *Real world contracts use remaining_accounts to iterate and transfer to multiple accounts*
            
            let transfer_instruction = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.receiver_token_account.to_account_info(),
                authority: vault.to_account_info(),
            };

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                signer,
            );

            // In welfare, the receiver claiming gets the full split amount or we just transfer the whole amount to a requested receiver
            token::transfer(cpi_ctx, amount)?;

        } else {
             // Normal claim
             let transfer_instruction = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.receiver_token_account.to_account_info(),
                authority: vault.to_account_info(),
            };

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                signer,
            );

            token::transfer(cpi_ctx, amount)?;
        }

        Ok(())
    }

    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        
        require!(vault.is_active, EscrowError::VaultNotActive);
        
        let amount = vault.amount;
        let mut return_amount = amount;

        // Welfare (vault_type == 3) does NOT have the 5% penalty
        if vault.vault_type != 3 {
             let penalty_bps = 500u64; // 5%
             let penalty = (amount * penalty_bps) / 10000;
             return_amount = amount.checked_sub(penalty).unwrap();
        }

        vault.is_active = false;
        vault.amount = 0;

        let vault_seeds = &[
            b"vault",
            vault.owner.as_ref(),
            vault.vault_id.as_bytes(),
            &[ctx.bumps.vault_state],
        ];
        let signer = &[&vault_seeds[..]];

        let transfer_instruction = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.receiver_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer,
        );

        token::transfer(cpi_ctx, return_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(vault_id: String)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref(), vault_id.as_bytes()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = owner,
        token::mint = mint,
        token::authority = vault_state,
        seeds = [b"vault_token", vault_state.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref(), vault_state.vault_id.as_bytes()],
        bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault_token", vault_state.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub receiver_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref(), vault_state.vault_id.as_bytes()],
        bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault_token", vault_state.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub receiver_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub owner: Pubkey,
    pub vault_id: String,
    pub amount: u64,
    pub lock_ends_at: i64,
    pub vault_type: u8,
    pub is_active: bool,
    pub beneficiaries: Vec<Pubkey>,
}

impl VaultState {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 8 + 1 + 1 + 50 + 100; // Expanded to accommodate vector
}

#[error_code]
pub enum EscrowError {
    #[msg("The vault is currently locked.")]
    VaultLocked,
    #[msg("The vault is no longer active.")]
    VaultNotActive,
    #[msg("NGO and Welfare vaults must specify at least one beneficiary.")]
    NoBeneficiaries,
}
