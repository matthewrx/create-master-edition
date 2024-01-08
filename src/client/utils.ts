import os from "os";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import * as web3 from "@solana/web3.js";
import * as spl from "@solana/spl-token";

export const metadataProgramID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const authProgramID = new web3.PublicKey(
  "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"
);

/**
 * @private
 */
async function getConfig(): Promise<any> {
  // Path to Solana CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    ".config",
    "solana",
    "cli",
    "config.yml"
  );
  const configYml = fs.readFileSync(CONFIG_FILE_PATH, { encoding: "utf8" });
  return yaml.parse(configYml);
}

export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    return config.json_rpc_url;
  } catch (err) {
    throw err;
  }
}

export async function getPayer(): Promise<web3.Keypair> {
  try {
    const config = await getConfig();
    if (!config.keypair_path) throw new Error("Missing keypair path");
    return await createKeypairFromFile(config.keypair_path);
  } catch (err) {
    throw err;
  }
}

export async function createKeypairFromFile(
  filePath: string
): Promise<web3.Keypair> {
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf-8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return web3.Keypair.fromSecretKey(secretKey);
}

export function getTokenWallet(wallet: web3.PublicKey, mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export function getEditionPDA(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metadataProgramID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    metadataProgramID
  )[0];
}

export function getMasterEdition(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metadataProgramID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    metadataProgramID
  )[0];
}

export function getMetadataPDA(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgramID.toBuffer(), mint.toBuffer()],
    metadataProgramID
  )[0];
}

export function addComputeUnitLimitIX(amount: number) {
  return web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: amount,
  });
}

export function addComputerUnitPrice(amount: number) {
  return web3.ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: amount,
  });
}
