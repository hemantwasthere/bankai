import { Contract, RpcProvider, Account } from "starknet";
import dotenv from "dotenv";

export const path = __dirname + "/../.env.local";

dotenv.config({ path: path });

export const sepoliaRpc = process.env.SEPOLIA_RPC as string;

export const provider = new RpcProvider({ nodeUrl: sepoliaRpc });

export const owner_private_key: any = process.env.PRIVATE_KEY as string;
export const owner_account_address = process.env.ACCOUNT_ADDRESS as string;

export async function get_contract_instance(name: 'PROJECTNFT' | 'STAKING' | 'CONTRIBUTORSBT') {
  const contract_address = name === 'STAKING' ? process.env.STAKING_CONTRACT_ADDRESS as string : name === 'PROJECTNFT' ? process.env.PROJECTNFT_CONTRACT_ADDRESS as string : process.env.CONTRIBUTORSBT_CONTRACT_ADDRESS as string;
  const { abi: Abi } = await provider.getClassAt(contract_address);
  if (Abi === undefined) {
    throw new Error("no abi.");
  }

  return new Contract(Abi, contract_address, provider);
}

export function get_owner() {
  return (new Account(
    provider,
    owner_account_address,
    owner_private_key,
    "1"
  ));
}