import * as web3 from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import * as borsh from "borsh";
export * from "./borsh";
import path from "path";
import fs from "fs";
import { CreateMasterEditionData, CreateMasterEditionSchema } from "./schema";

import {
  getPayer,
  getRpcUrl,
  createKeypairFromFile,
  getMasterEdition,
  getMetadataPDA,
  getEditionPDA,
  getTokenWallet,
  metadataProgramID,
  authProgramID,
  addComputeUnitLimitIX,
  addComputerUnitPrice,
} from "./utils";

export let connection: web3.Connection;

let payer: web3.Keypair;

export let programId: web3.PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, "../../src/rust/target/deploy/");

const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, "rust_boiler.so");

const PROGRAM_KP_PATH = path.join(PROGRAM_PATH, "rust_boiler-keypair.json");

export async function establishConnection(): Promise<void> {
  const rpcUrl = await getRpcUrl();
  connection = new web3.Connection(rpcUrl, "confirmed");
  const version = await connection.getVersion();
  console.log("Connection to cluster established:", rpcUrl, version);
}

export async function establishPayer(): Promise<void> {
  if (!payer) {
    payer = await getPayer();
  }

  let lamports = await connection.getBalance(payer.publicKey);

  console.log(
    `using account: ${payer.publicKey.toBase58()} with balance of: ${
      lamports / web3.LAMPORTS_PER_SOL
    } SOL`
  );
}

export async function checkAccounts(): Promise<void> {
  const programKeypair = await createKeypairFromFile(PROGRAM_KP_PATH);
  programId = programKeypair.publicKey;

  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error("Program needs to be deployed");
    } else {
      throw new Error("Program needs to be built and deployed");
    }
  } else if (!programInfo.executable) {
    throw new Error("Program is not executable");
  }
  console.log(`using program: ${programId.toBase58()}`);
}

export async function create_master_edition() {
  let file = `./src/client/master_editions/${process.argv[2]}.json`;
  const config = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

  console.log(config);

  if (!config.mint) {
    let mint_key = web3.Keypair.generate();
    config.mint = mint_key.publicKey.toBase58();
    config.mint_private = Array.from(mint_key.secretKey);
  }

  fs.writeFileSync(file, JSON.stringify(config, null, 4));

  let mint_k = web3.Keypair.fromSecretKey(new Uint8Array(config.mint_private));
  let mint_acc = await connection.getAccountInfo(mint_k.publicKey);

  if (mint_acc === null) {
    let tx = new web3.Transaction();

    let token_account = getTokenWallet(payer.publicKey, mint_k.publicKey);
    let meta_account = getMetadataPDA(mint_k.publicKey);
    let master_edition_account = getMasterEdition(mint_k.publicKey);

    let acc1 = {
        pubkey: payer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      acc2 = {
        pubkey: mint_k.publicKey,
        isSigner: true,
        isWritable: true,
      },
      acc3 = {
        pubkey: token_account,
        isSigner: false,
        isWritable: true,
      },
      acc4 = {
        pubkey: meta_account,
        isSigner: false,
        isWritable: true,
      },
      acc5 = {
        pubkey: master_edition_account,
        isSigner: false,
        isWritable: true,
      },
      acc6 = {
        pubkey: spl.TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      acc7 = {
        pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      acc8 = {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      acc9 = {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      acc10 = {
        pubkey: metadataProgramID,
        isSigner: false,
        isWritable: false,
      },
      acc11 = {
        pubkey: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        isSigner: false,
        isWritable: false,
      };

    const create_me_data = Array.from(
      new Uint8Array(
        Buffer.from(
          borsh.serialize(
            CreateMasterEditionSchema,
            new CreateMasterEditionData(config)
          )
        )
      )
    );

    tx.add(addComputeUnitLimitIX(1000000)).add(
      new web3.TransactionInstruction({
        keys: [
          acc1,
          acc2,
          acc3,
          acc4,
          acc5,
          acc6,
          acc7,
          acc8,
          acc9,
          acc10,
          acc11,
        ],
        programId: programId,
        data: Buffer.from(new Uint8Array([69].concat(create_me_data))),
      })
    );

    let sig = await web3.sendAndConfirmTransaction(
      connection,
      tx,
      [payer, mint_k],
      {
        skipPreflight: false,
      }
    );

    console.log(`txn: https://solscan.io/tx/${sig}`);
    console.log(
      `token: https://solscan.io/token/${mint_k.publicKey.toBase58()}`
    );
  }
}
