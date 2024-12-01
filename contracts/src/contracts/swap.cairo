use starknet::{ContractAddress, get_contract_address, ClassHash};
use bankai_contract::storage::data_modal::{SwapFees, LST};

#[starknet::interface]
pub trait ISwapStrat<T> {
    fn swap(ref self: T, from_add: ContractAddress, to_add: ContractAddress, from_amt: u256);
    fn get_LST_data(ref self: T, token: ContractAddress) -> LST; 
    fn get_amt_after_fee(ref self: T, from_val: u256, input_fee: u256, output_fee: u256) -> (u256, u256);
    fn add_lst(ref self: T, lst_address: ContractAddress);
}

#[starknet::contract]
mod Swap {
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use super::{ISwapStrat};
    use bankai_contract::storage::data_modal::{SwapFees, LST};
    use openzeppelin::access::ownable::ownable::OwnableComponent;
    use bankai_contract::utils::{ERC20Helper};
    use erc4626::erc4626::interface::{IERC4626Dispatcher, IERC4626DispatcherTrait};
    use bankai_contract::external::pow;
    use openzeppelin::security::reentrancyguard::{ReentrancyGuardComponent };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ReentrancyGuardComponent, storage: reng, event: ReentrancyGuardEvent);

    #[abi(embed_v0)]
    impl OwnableTwoStepImpl = OwnableComponent::OwnableTwoStepImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        reng: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        lst_num: u256,
        lstTokens: LegacyMap::<ContractAddress, LST>,
        min_liquidity: u256,
        max_liquidity: u256,
        fee_constant: u256,
        fee_collector: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        Swap: Swap
    }

    #[derive(Drop, starknet::Event)]
    pub struct Swap {
        pub from: ContractAddress,
        pub to: ContractAddress,
        pub from_val: u256,
        pub to_val: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        fee_constant: u256,
        fee_collector: ContractAddress,
        min_liquidity: u256,
        max_liquidity: u256,
    ) {
        self.ownable.initializer(owner);
        self.fee_constant.write(fee_constant);
        self.fee_collector.write(fee_collector);
        self.min_liquidity.write(min_liquidity);
        self.max_liquidity.write(max_liquidity);
    }

    #[abi(embed_v0)]
    impl SwapImpl of ISwapStrat<ContractState> {
        fn swap(
            ref self: ContractState,
            from_add: ContractAddress,
            to_add: ContractAddress,
            from_amt: u256,
        ) {
            self.reng.start();
            assert(from_amt > 0, 'SWAP: Invalid swap amount');
            let this = get_contract_address();
            let caller= get_caller_address();
            let from_data = self.get_LST_data(from_add);
            let to_data = self.get_LST_data(to_add);
            ERC20Helper::strict_transfer_from(from_add ,caller, this, from_amt);
            let (from_amt_fee, fees) = self.get_amt_after_fee(
                from_amt,
                from_data.fees.input_fee, 
                to_data.fees.output_fee
            );
            ERC20Helper::strict_transfer_from(
                from_add,
                this, 
                self.fee_collector.read(),
                fees
            );
            let strk_amt = IERC4626Dispatcher {contract_address: from_add}
            .convert_to_assets(from_amt_fee);
            let to_token_amount = IERC4626Dispatcher {contract_address: to_add}
            .convert_to_shares(strk_amt);
            ERC20Helper::strict_transfer_from(to_add, this, caller, to_token_amount);
            self.reng.end();
        }

        fn get_LST_data(ref self: ContractState, token: ContractAddress) -> LST {
            self.lstTokens.read(token)
        }

        fn get_amt_after_fee(ref self: ContractState, from_val: u256, input_fee: u256, output_fee: u256) -> (u256, u256 ) {
            let token_fees = input_fee + output_fee;
            let fee_const = self.fee_constant.read();
            // @audit rounding error
            let fees = (from_val * ( token_fees / 1000 )) / fee_const;
             
            ( from_val - fees , fees)
        }

        //checking git 

        fn add_lst(ref self: ContractState, lst_address: ContractAddress) {
            self.ownable.assert_only_owner();
            let lst_data = LST {
                token_address: lst_address,
                fees: SwapFees {
                    input_fee: 0,
                    output_fee: 10
                }
            };  
            let lst_count = self.lst_num.read();
            self.lstTokens.write(lst_address, lst_data);
            self.lst_num.write(lst_count + 1);
            // @audit incorrect math
            self.min_liquidity.write((4 * 100) / lst_count + 1);
            self.max_liquidity.write((100 * 100) / lst_count +1);
        }
    }
}