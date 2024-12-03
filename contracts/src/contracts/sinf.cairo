use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Strat<TContractState> {
    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, account: ContractAddress, amount: u256);
}

#[starknet::contract]
mod SINFToken {
    use openzeppelin::introspection::interface::{ISRC5Dispatcher, ISRC5DispatcherTrait};
    use openzeppelin::introspection::src5::SRC5Component::InternalTrait as SRC5InternalTrait;
    use openzeppelin::introspection::src5::SRC5Component;

    use super::{IERC20Strat,IERC20StratDispatcher,IERC20StratDispatcherTrait};
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address,get_contract_address};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        vault: ContractAddress,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState,vault:ContractAddress) {
        let name = "SINF";
        let symbol = "SINF";
        self.erc20.initializer(name, symbol);
        self.vault.write(vault);
    }

    #[abi(embed_v0)]
    impl IERC20StratImpl of IERC20Strat<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.vault.read(), 'not a owner');
            let this = get_contract_address();
            IERC20StratDispatcher{contract_address:this}.mint(recipient,amount);
        }

        fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.vault.read(), 'not a owner');
            let this = get_contract_address();
            IERC20StratDispatcher{contract_address:this}.burn(account,amount);
        }     
    }
}
