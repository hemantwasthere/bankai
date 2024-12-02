use starknet::ContractAddress;

#[starknet::interface]
pub trait IVaultStrat<TContractState> {
    fn deposit_lst(ref self:TContractState, asset:ContractAddress,amount:u256);
    fn withdraw_lst(ref self:TContractState, asset:ContractAddress,shares:u256,receiver:ContractAddress);
    fn preview_deposit(self: @TContractState,asset:ContractAddress, assets:u256) -> u256;
    fn preview_redeem(self: @TContractState,asset:ContractAddress, shares:u256) -> u256;
    fn convert_to_assets(self:@TContractState,asset:ContractAddress, shares:u256, round:bool) -> u256;
    fn convert_to_shares(self:@TContractState,asset:ContractAddress, assets:u256, round:bool) -> u256;
    fn total_assets(self:@TContractState) -> u256;
    fn total_supply(self:@TContractState) -> u256;
    fn init_token(ref self:TContractState, sinf:ContractAddress);
}

#[starknet::contract]
mod Vault {
    use openzeppelin::introspection::interface::{ISRC5Dispatcher, ISRC5DispatcherTrait};
    use openzeppelin::introspection::src5::SRC5Component::InternalTrait as SRC5InternalTrait;
    use openzeppelin::introspection::src5::SRC5Component;

    use erc4626::erc4626::interface::{IERC4626Dispatcher, IERC4626DispatcherTrait};
    use erc4626::utils::{pow_256};
    use bankai_contract::utils::{ERC20Helper};
    use bankai_contract::contracts::sinf::{IERC20Strat,IERC20StratDispatcher,IERC20StratDispatcherTrait};
    use bankai_contract::contracts::swap::{ISwapStrat,ISwapStratDispatcher,ISwapStratDispatcherTrait};
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
        swap_contract:ContractAddress,
        sinf:ContractAddress,
        owner:ContractAddress,
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

    #[constructor]
    fn constructor(
        ref self:ContractState,
        sinf: ContractAddress,
        swap_contract:ContractAddress,
    ) {
        self.sinf.write(sinf);
        self.swap_contract.write(swap_contract);
        self.owner.write(get_caller_address());
        self.offset.write(0);
        self.underlying_decimals.write(18);
    }

    #[abi(embed_v0)]
    impl VaultImpl of super::IVaultStrat<ContractState> {
        fn deposit_lst(
            ref self:ContractState,
            asset:ContractAddress,
            amount:u256,
        ){
            let caller = get_caller_address();
            let this = get_contract_address();
            let swap_contract = self.swap_contract.read();
            let swap_contract_dispatcher = ISwapStratDispatcher{contract_address :self.swap_contract.read() };
            let from_data = swap_contract_dispatcher.get_LST_data(asset);
            ERC20Helper::strict_transfer_from(asset ,caller, swap_contract, amount);

            let shares = self.preview_deposit(asset,amount);

            let _sinf = self.sinf.read();
            let sinf_dispatcher = IERC20StratDispatcher {contract_address:_sinf};
            sinf_dispatcher.mint(caller,shares);
            let updated_lst_amount = self.pool_lst_amounts.read(asset) + amount;
            self.pool_lst_amounts.write(asset,updated_lst_amount);
        }

        fn withdraw_lst(
            ref self:ContractState,
            asset:ContractAddress,
            shares:u256,
            receiver:ContractAddress
        ){
            let caller = get_caller_address();
            let this = get_contract_address();
            let swap_contract = self.swap_contract.read();
            let swap_contract_dispatcher = ISwapStratDispatcher{contract_address:swap_contract};
            
            let _sinf = self.sinf.read();
            let sinf_token_dispatcher = IERC20Dispatcher {contract_address:_sinf};
            let sinf_dispatcher = IERC20StratDispatcher {contract_address:_sinf};
            ERC20Helper::strict_transfer_from(_sinf,caller,this,shares);
            let user_sinf_balance = sinf_token_dispatcher.balance_of(caller);
            sinf_dispatcher.burn(caller,shares);

            assert(user_sinf_balance >= shares,'cannot withdraw more than own');

            let lst_to_withdraw = self.preview_redeem(asset,shares);
            let updated_lst_amount = self.pool_lst_amounts.read(asset) - lst_to_withdraw;
            self.pool_lst_amounts.write(asset,updated_lst_amount);

            swap_contract_dispatcher.request_withdrawal(asset,lst_to_withdraw,receiver);
        }

        
        fn init_token(ref self: ContractState, sinf: ContractAddress) {
            let caller = get_caller_address();
            assert(self.owner.read() == caller,'Not a owner');
            self.sinf.write(sinf);
        }

        fn preview_deposit(self: @ContractState,asset:ContractAddress, assets: u256) -> u256 {
            self.convert_to_shares(asset,assets, false)
        }

        fn preview_redeem(self: @ContractState,asset:ContractAddress, shares: u256) -> u256 {
            self.convert_to_assets(asset,shares, false)
        }

        fn convert_to_assets(self: @ContractState,asset:ContractAddress, shares: u256, round: bool) -> u256 {
            let total_assets = self.total_assets() + 1;
            let total_shares = self.total_supply() + pow_256(10, self.offset.read());
            let value_in_strk = (shares * total_shares) / total_assets;
            let value_in_target_lst = IERC4626Dispatcher {contract_address: asset}.convert_to_shares(value_in_strk);
            let assets = value_in_target_lst;
            if round && ((value_in_strk * total_shares) / total_assets < shares) {
                assets + 1
            } else {
                assets
            }
        }

        fn convert_to_shares(self: @ContractState,asset:ContractAddress, assets: u256, round: bool) -> u256 {
            let total_assets = self.total_assets() + 1;
            let total_shares = self.total_supply() + pow_256(10, self.offset.read());
            let value_in_strk = IERC4626Dispatcher {contract_address: asset}.convert_to_assets(assets);
            let share = value_in_strk * total_assets / total_shares;
            if round && ((share * total_assets) / total_shares < value_in_strk) {
                share + 1
            } else {
                share
            }
        }

        fn total_assets(self: @ContractState) -> u256 {
            let swap = self.swap_contract.read();
            let swap_dispatcher = ISwapStratDispatcher{contract_address:swap};
            swap_dispatcher.total_liquidity()
        }

        fn total_supply(self: @ContractState) -> u256 {
            let _sinf = self.sinf.read();
            let sinf_dispatcher = IERC20Dispatcher {contract_address:_sinf};
            sinf_dispatcher.total_supply()
        }
    }
}