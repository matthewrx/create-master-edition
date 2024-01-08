use {
    num_derive::FromPrimitive,
    solana_program::{
        decode_error::DecodeError,
        msg,
        program_error::{PrintProgramError, ProgramError},
    },
    thiserror::Error,
};

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum CustomError {
    #[error("Invalid Signer")]
    InvalidSigner,
}

impl PrintProgramError for CustomError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<CustomError> for ProgramError {
    fn from(e: CustomError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for CustomError {
    fn type_of() -> &'static str {
        "Metadata Error"
    }
}
