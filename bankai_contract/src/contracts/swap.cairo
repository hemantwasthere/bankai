use starknet::ContractAddress;

#[starknet::interface]
pub trait ISwapStrat<T> {
    fn swap(ref self: T, from_add: ContractAddress, to_add: ContractAddress, from_amt: u256);
}

#[starknet::contract]
mod Swap {
    use starknet::ContractAddress;
    use super::{ISwapStrat};
    use bankai_contract::storage::data_modal::{SwapFees, LST};

    #[storage]
    struct Storage {
        lstTokens: LegacyMap::<u256, LST>,
    }

    #[abi(embed_v0)]
    impl SwapImpl of ISwapStrat<ContractState> {
        fn swap(
            ref self: ContractState,
            from_add: ContractAddress,
            to_add: ContractAddress,
            from_amt: u256,
        ) {

        }
    }
}