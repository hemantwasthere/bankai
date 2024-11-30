use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct SwapFees {
    pub input_fee: u256,
    pub output_fee: u256
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct LST {
    pub token_address: ContractAddress,
    pub fees: SwapFees,
}

#[derive(PartialEq, Copy, Drop, Serde)]
struct AssetParams {
    asset: ContractAddress,
    floor: u256, // [SCALE]
    initial_rate_accumulator: u256, // [SCALE]
    initial_full_utilization_rate: u256, // [SCALE]
    max_utilization: u256, // [SCALE]
    is_legacy: bool,
    fee_rate: u256, // [SCALE]
}

#[derive(PartialEq, Copy, Drop, Serde)]
struct LTVParams {
    collateral_asset_index: usize,
    debt_asset_index: usize,
    max_ltv: u64, // [SCALE]
}

#[derive(PartialEq, Copy, Drop, Serde)]
struct DebtCapParams {
    collateral_asset_index: usize,
    debt_asset_index: usize,
    debt_cap: u256, // [SCALE]
}

#[derive(PartialEq, Copy, Drop, Serde)]
struct ModifyPositionParams {
    pool_id: felt252,
    collateral_asset: ContractAddress,
    debt_asset: ContractAddress,
    user: ContractAddress,
    collateral: Amount,
    debt: Amount,
    data: Span<felt252>
}