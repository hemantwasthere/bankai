use starknet::{ContractAddress, get_contract_address, ClassHash};
use bankai_contract::storage::data_modal::{SwapFees, LST};

#[starknet::interface]
pub trait ISwapStrat<T> {
    fn swap(ref self: T, from_add: ContractAddress, to_add: ContractAddress, from_amt: u256);
    fn get_LST_data(ref self: T, token: ContractAddress) -> LST; 
}

#[starknet::contract]
mod Swap {
    use starknet::ContractAddress;
    use 
    use super::{ISwapStrat};
    use bankai_contract::storage::data_modal::{SwapFees, LST};
    use openzeppelin::access::ownable::ownable::OwnableComponent;
    use bankai_contract::utils::{ERC20Helper};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableTwoStepImpl = OwnableComponent::OwnableTwoStepImpl<ContractState>;

    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        lstTokens: LegacyMap::<ContractAddress, LST>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
    ) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl SwapImpl of ISwapStrat<ContractState> {
        fn swap(
            ref self: ContractState,
            from_add: ContractAddress,
            to_add: ContractAddress,
            from_amt: u256,
        ) {
            let this = get_contract_address();
            let caller= get_caller_address();
            let from_data = self.get_LST_data(from_add);
            let to_data = self.get_LST_data(to_add);
            ERC20Helper::strict_transfer_from(from_data, this, from_add);
            //calculate how much to_token to send to user 
            //transfer to_token 
            //refac data for swapped LSTs
        }

        fn get_LST_data(ref self: ContractState, token: ContractAddress) -> LST {
            self.lstTokens.read(token)
        }
    }
}