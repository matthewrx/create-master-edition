#![allow(non_snake_case)]
#![allow(unused_imports)]

use {
    crate::error::CustomError,
    borsh::{BorshDeserialize, BorshSerialize},
    mpl_token_metadata::{
        instruction::{
            builders::{
                CreateBuilder, CreateMetadataAccountV3Builder, MintBuilder, UpdateBuilder,
                VerifyBuilder,
            },
            create_master_edition_v3, create_metadata_accounts_v3,
            set_and_verify_sized_collection_item, update_metadata_accounts_v2, CreateArgs,
            InstructionBuilder, MintArgs, RuleSetToggle, UpdateArgs, VerificationArgs,
        },
        state::{
            AssetData, Collection, CollectionDetails, Creator, Edition, MasterEdition, Metadata,
            PrintSupply, TokenStandard,
        },
    },
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        borsh::try_from_slice_unchecked,
        clock::Clock,
        entrypoint::ProgramResult,
        msg, program,
        program_error::ProgramError,
        program_pack::Pack,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        sysvar::Sysvar,
    },
    spl_associated_token_account::instruction::create_associated_token_account,
    spl_token::{
        instruction::{initialize_mint, mint_to},
        state::Account as TokenAccount,
    },
    std::cmp,
    std::collections::HashMap,
    std::convert::TryInto,
    std::mem::size_of,
    std::str::FromStr,
};

#[derive(BorshSerialize, BorshDeserialize, Default, Clone, Debug)]
struct CreateMasterEdition {
    seller_fee_bp: u16,
    name: String,
    symbol: String,
    uri: String,
    supply: u16,
}

pub fn mint_master_edition<'a>(
    _program_id: &'a Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let payer_account = next_account_info(accounts_iter)?; // 0
    let mint_account = next_account_info(accounts_iter)?; // 1
    let token_account = next_account_info(accounts_iter)?; // 2
    let metadata_account = next_account_info(accounts_iter)?; // 3
    let master_edition_account = next_account_info(accounts_iter)?; // 4
    let token_program = next_account_info(accounts_iter)?; // 5
    let associate_program = next_account_info(accounts_iter)?; // 6
    let system_program = next_account_info(accounts_iter)?; // 7
    let _rent_program = next_account_info(accounts_iter)?; // 8
    let metadata_program = next_account_info(accounts_iter)?; // 9
    let sys_instr = next_account_info(accounts_iter)?; // 10

    let _pay_key: String = payer_account.key.to_string();

    if payer_account.is_signer == false {
        return Err(CustomError::InvalidSigner.into());
    }

    let input_data: CreateMasterEdition =
        try_from_slice_unchecked::<CreateMasterEdition>(input).unwrap();

    let creators: Vec<Creator> = vec![Creator {
        address: *payer_account.key,
        verified: true,
        share: 100,
    }];

    let create_builder: solana_program::instruction::Instruction = CreateBuilder::new()
        .metadata(*metadata_account.key)
        .master_edition(*master_edition_account.key)
        .mint(*mint_account.key)
        .authority(*payer_account.key)
        .payer(*payer_account.key)
        .update_authority(*payer_account.key)
        .system_program(*system_program.key)
        .sysvar_instructions(*sys_instr.key)
        .spl_token_program(*token_program.key)
        .initialize_mint(true)
        .update_authority_as_signer(true)
        .build(CreateArgs::V1 {
            asset_data: AssetData {
                name: input_data.name.clone(),
                symbol: input_data.symbol.clone(),
                uri: input_data.uri.clone(),
                seller_fee_basis_points: input_data.seller_fee_bp,
                creators: Some(creators),
                primary_sale_happened: false,
                is_mutable: true,
                token_standard: TokenStandard::NonFungible,
                collection: None,
                uses: None,
                collection_details: None,
                rule_set: None,
            },
            decimals: Some(0),
            print_supply: Some(PrintSupply::Limited(input_data.supply as u64)),
        })
        .unwrap()
        .instruction();

    let create_infos: Vec<AccountInfo<'_>> = vec![
        metadata_program.clone(),
        metadata_account.clone(),
        master_edition_account.clone(),
        mint_account.clone(),
        payer_account.clone(),
        payer_account.clone(),
        payer_account.clone(),
        system_program.clone(),
        sys_instr.clone(),
        token_program.clone(),
    ];

    program::invoke(&create_builder, &create_infos)?;

    let mint_builder: solana_program::instruction::Instruction = MintBuilder::new()
        .token(*token_account.key)
        .token_owner(*payer_account.key)
        .metadata(*metadata_account.key)
        .master_edition(*master_edition_account.key)
        .mint(*mint_account.key)
        .authority(*payer_account.key)
        .payer(*payer_account.key)
        .system_program(*system_program.key)
        .sysvar_instructions(*sys_instr.key)
        .spl_token_program(*token_program.key)
        .spl_ata_program(*associate_program.key)
        .build(MintArgs::V1 {
            amount: 1,
            authorization_data: None,
        })
        .unwrap()
        .instruction();

    let mint_infos: Vec<AccountInfo<'_>> = vec![
        token_account.clone(),
        payer_account.clone(),
        metadata_account.clone(),
        master_edition_account.clone(),
        mint_account.clone(),
        payer_account.clone(),
        payer_account.clone(),
        system_program.clone(),
        sys_instr.clone(),
        token_program.clone(),
        associate_program.clone(),
    ];

    program::invoke(&mint_builder, &mint_infos)?;

    Ok(())
}
