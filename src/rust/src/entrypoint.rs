pub mod error;
pub mod processor;

use {
    crate::error::CustomError,
    solana_program::{
        account_info::AccountInfo, entrypoint, entrypoint::ProgramResult,
        program_error::PrintProgramError, program_error::ProgramError, pubkey::Pubkey,
    },
};

entrypoint!(process_instruction);

fn process_instruction<'a>(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction: u8 = instruction_data[0];

    if let Err(error) = match instruction {
        69 => processor::mint_master_edition(program_id, accounts, &instruction_data[1..]),
        _ => Err(ProgramError::InvalidArgument),
    } {
        error.print::<CustomError>();
        return Err(error);
    }

    Ok(())
}
