use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct SwapFees {
    pub input_fee: u256,
    pub output_fee: u256
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct LST {
    pub lst_id: u256,
    pub token_address: ContractAddress,
    pub fees: SwapFees,
}

