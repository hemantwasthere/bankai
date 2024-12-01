use starknet::ContractAddress;

#[starknet::interface]
pub trait IVaultStrat<TContractState> {
    fn deposit_lst(ref self:TContractState, asset:ContractAddress,amount:u256,receiver: ContractAddress);
    fn withdraw_lst(ref self:TContractState, asset:ContractAddress,amount:u256,receiver:ContractAddress);

}

#[starknet::contract]
mod Vault {
    use openzeppelin::introspection::interface::{ISRC5Dispatcher, ISRC5DispatcherTrait};
    use openzeppelin::introspection::src5::SRC5Component::InternalTrait as SRC5InternalTrait;
    use openzeppelin::introspection::src5::SRC5Component;

    use core::starknet::event::EventEmitter;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    // use starknet::storage::{ StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry };
    // use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};


    #[storage]
    struct Storage {
        assets: LegacyMap<u256,ContractAddress>,
        no_of_lsts:u256,
        pool_lst_amounts: LegacyMap<ContractAddress,u256>,
        underlying_decimals: u8,
        offset: u8,
        user_lst_amount: LegacyMap::<(ContractAddress, ContractAddress), u256>,
        swap_contract:ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposit: Deposit,
        Withdraw: Withdraw,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        sender: ContractAddress,
        #[key]
        owner: ContractAddress,
        assets: u256,
        shares: u256
    }

    #[derive(Drop, starknet::Event)]
    struct Withdraw {
        #[key]
        sender: ContractAddress,
        #[key]
        receiver: ContractAddress,
        #[key]
        owner: ContractAddress,
        assets: u256,
        shares: u256
    }

    mod Errors {
        const EXCEEDED_MAX_DEPOSIT: felt252 = 'ERC4626: exceeded max deposit';
        const EXCEEDED_MAX_MINT: felt252 = 'ERC4626: exceeded max mint';
        const EXCEEDED_MAX_REDEEM: felt252 = 'ERC4626: exceeded max redeem';
        const EXCEEDED_MAX_WITHDRAW: felt252 = 'ERC4626: exceeded max withdraw';
    }

    #[abi(embed_v0)]
    impl VaultImpl of super::IVaultStrat<ContractState> {
        fn deposit_lst(
            ref self:ContractState,
            asset:ContractAddress,
            amount:u256,
            receiver:ContractAddress,
        ){
            let caller = get_caller_address();
            // let lst_value_in_strk:u256 = self.get_lsts_value_in_strk();
        }

        fn withdraw_lst(
            ref self:ContractState,
            asset:ContractAddress,
            amount:u256,
            receiver:ContractAddress,
        ){

        }

        // fn get_lsts_value_in_strk(
        //     ref self:ContractState,
        // ) -> u256 {
        //     // let amount:u256;

        // }

        // fn preview_deposit(self: @ContractState, assets: u256) -> u256 {
        //     self._convert_to_shares(assets, false)
        // }

        // fn preview_redeem(self: @ComponentState<TContractState>, shares: u256) -> u256 {
        //     self._convert_to_assets(shares, false)
        // }

        // fn _convert_to_assets(self: @ComponentState<TContractState>, shares: u256, round: bool) -> u256 {
        //     let total_assets = self.total_assets() + 1;
        //     let total_shares = self.total_supply() + pow_256(10, self.offset.read());
        //     let assets = shares * total_assets / total_shares;
        //     if round && ((assets * total_shares) / total_assets < shares) {
        //         assets + 1
        //     } else {
        //         assets
        //     }
        // }

        // fn _convert_to_shares(self: @ComponentState<TContractState>, assets: u256, round: bool) -> u256 {
        //     let total_assets = self.total_assets() + 1;
        //     let total_shares = self.total_supply() + pow_256(10, self.offset.read());
        //     let share = assets * total_shares / total_assets;
        //     if round && ((share * total_assets) / total_shares < assets) {
        //         share + 1
        //     } else {
        //         share
        //     }
        // }
    }

}