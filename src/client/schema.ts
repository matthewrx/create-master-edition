export * from "./borsh";
import * as borsh from "borsh";
import { Buffer } from "buffer";
const BN = require("bn.js");

export class CreateMasterEditionData {
  seller_fee_bp: number;
  name: string;
  symbol: string;
  uri: string;
  supply: number;
  constructor(properties: any) {
    this.seller_fee_bp = properties.seller_fee_bp;
    this.name = properties.name;
    this.symbol = properties.symbol;
    this.uri = properties.uri;
    this.supply = properties.supply;
  }
}

export const CreateMasterEditionSchema = new Map<any, any>([
  [
    CreateMasterEditionData,
    {
      kind: "struct",
      fields: [
        ["seller_fee_bp", "u16"],
        ["name", "string"],
        ["symbol", "string"],
        ["uri", "string"],
        ["supply", "u16"],
      ],
    },
  ],
]);
