use starknet::{ContractAddress, get_contract_address, ClassHash};
use bankai_contract::storage::data_modal::{SwapFees, LST};

#[starknet::interface]
pub trait ISwapStrat<T> {
    fn swap(ref self: T, from_add: ContractAddress, to_add: ContractAddress, from_amt: u256);
    fn get_LST_data(self: @T, token: ContractAddress) -> LST; 
    fn get_amt_after_fee(self: @T, from_val: u256, input_fee: u256, output_fee: u256) -> (u256, u256);
    fn add_lst(ref self: T, lst_address: ContractAddress);
    fn total_liquidity(self: @T) -> u256;
    fn set_fees(ref self: T, lst_address: ContractAddress);
    fn init_pool_creation(ref self: T, token_amount: u256);
    fn request_withdrawal(ref self:T,asset:ContractAddress,lst_amount:u256,receiver:ContractAddress);
    fn vault_init(ref self:T,vault_:ContractAddress);
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
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::security::pausable::{PausableComponent};
    use bankai_contract::utils::common::CommonComp;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ReentrancyGuardComponent, storage: reng, event: ReentrancyGuardEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: CommonComp, storage: common, event: CommonCompEvent);

    #[abi(embed_v0)]
    impl CommonCompImpl = CommonComp::CommonImpl<ContractState>;
    impl CommonInternalImpl = CommonComp::InternalImpl<ContractState>;
    impl OwnableTwoStepImpl = OwnableComponent::OwnableTwoStepImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        reng: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        common: CommonComp::Storage,
        lst_num: u256,
        lst_tokens: LegacyMap::<ContractAddress, LST>,
        lst_addresses: LegacyMap::<u256, ContractAddress>,
        min_liquidity: u256,
        max_liquidity: u256,
        fee_constant: u256,
        fee_collector: ContractAddress,
        vault: ContractAddress
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        CommonCompEvent: CommonComp::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        Swap: Swap
    }

    #[derive(Drop, starknet::Event)]
    pub struct Swap {
        pub from_add: ContractAddress,
        pub to_add: ContractAddress,
        pub from_amt: u256,
        pub to_amt: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        fee_constant: u256,
        fee_collector: ContractAddress,
        min_liquidity: u256,
        max_liquidity: u256,
        lst_data: Array<LST>,
        lst_addresses: Array<ContractAddress>,
    ) {
        self.ownable.initializer(owner);
        self.fee_constant.write(fee_constant);
        self.fee_collector.write(fee_collector);
        self.min_liquidity.write(min_liquidity);
        self.max_liquidity.write(max_liquidity);
        assert(lst_data.len() == lst_addresses.len(), 'SWAP: invalid data');
        let len: u256 = lst_data.len().into();
        self.lst_num.write(len);
        let mut count: u256 = 0;
        loop {
            if(count < len) {
                let count_u32: u32 = count.try_into().unwrap();
                self.lst_tokens.write(*lst_addresses.at(count_u32), *lst_data.at(count_u32));
                self.lst_addresses.write(count, *lst_addresses.at(count_u32));
                count +=1;
            } else {
                break;
            }
        };
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
            self.set_fees(from_add);
            self.set_fees(to_add);
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
            let fee_collector = self.fee_collector.read();
            ERC20Helper::transfer(
                from_add,
                fee_collector,
                fees
            );
            let strk_amt = IERC4626Dispatcher {contract_address: from_add}
            .convert_to_assets(from_amt_fee);
            let to_amt = IERC4626Dispatcher {contract_address: to_add}
            .convert_to_shares(strk_amt);
            ERC20Helper::strict_transfer(to_add, caller, to_amt);
            self.emit(Swap {from_add, to_add, from_amt, to_amt});

            //fee changes for from_token
            self.set_fees(from_add);
            self.set_fees(to_add);

            self.reng.end();
        }

        fn get_LST_data(self: @ContractState, token: ContractAddress) -> LST {
            self.lst_tokens.read(token)
        }

        fn get_amt_after_fee(self: @ContractState, from_val: u256, input_fee: u256, output_fee: u256) -> (u256, u256 ) {
            let token_fees = input_fee + output_fee;
            let fee_const = self.fee_constant.read();
            // @audit rounding error
            let fees = ((from_val * token_fees) / 1000) / fee_const;
             
            ( from_val - fees , fees)
        }

        fn add_lst(ref self: ContractState, lst_address: ContractAddress) {
            let this = get_contract_address();
            let caller = get_caller_address();
            self.reng.start();
            self.ownable.assert_only_owner();
            let lst_count = self.lst_num.read();
            let lst_data = LST {
                lst_id: lst_count + 1,
                token_address: lst_address,
                fees: SwapFees {
                    input_fee: 0,
                    output_fee: 10
                }
            };  
            self.lst_tokens.write(lst_address, lst_data);
            self.lst_num.write(lst_count + 1);
            // @audit incorrect math
            self.min_liquidity.write((4 * 100) / lst_count + 1);
            self.max_liquidity.write((100 * 100) / lst_count +1);

            let total_strk = self.total_liquidity();

            let new_lst_val = IERC4626Dispatcher {contract_address: lst_address}
            .convert_to_shares(total_strk);

            let min_liq = self.min_liquidity.read();
            let min_liquidity = (new_lst_val * min_liq) / 100;

            ERC20Helper::strict_transfer_from(lst_address, caller, this, min_liquidity);

            self.reng.end();
        }

        fn total_liquidity(self: @ContractState) -> u256 {
            let this = get_contract_address();
            let total_lst = self.lst_num.read();
            let mut count = 0; 
            let mut total_bal = 0;
            loop {
                if(count < total_lst) {
                    let token = self.lst_addresses.read(count);
                    let bal = ERC20Helper::balanceOf(token, this);
                    let strk_eq = IERC4626Dispatcher {contract_address: token}
                    .convert_to_assets(bal);
                    total_bal += strk_eq;
                    count += 1;
                } else {
                    break;
                }
            };

            total_bal
        }

        fn set_fees(ref self: ContractState, lst_address: ContractAddress) {
            let this = get_contract_address();
            let total_liq = self.total_liquidity();
            let token_bal = ERC20Helper::balanceOf(lst_address, this);
            let strk_eq = IERC4626Dispatcher {contract_address: lst_address}
            .convert_to_assets(token_bal);
            let liq_bps = (strk_eq * 100 * 100) / total_liq;
            let min_bps = self.min_liquidity.read();
            let max_bps = self.max_liquidity.read();

            // fees formulation 
            let mut input_fees = 0;
            let mut output_fees = 0;
            if(liq_bps > max_bps) {
                input_fees = 10;
                output_fees = 0;
            } else if (liq_bps < min_bps) {
                input_fees = 0;
                output_fees = 10;
            } else {
                input_fees = ((liq_bps - min_bps) * 10) / (max_bps - min_bps);
                output_fees = ((max_bps - liq_bps) * 10) / (max_bps - min_bps);
            }

            let mut lst = self.get_LST_data(lst_address);
            lst.fees.input_fee = input_fees;
            lst.fees.output_fee = output_fees;
            self.lst_tokens.write(lst_address, lst); 
        } 

        fn init_pool_creation(ref self: ContractState, token_amount: u256) {
            let this = get_contract_address();
            let caller = get_caller_address();
            self.reng.start();
            self.ownable.assert_only_owner();
            let mut count = 0;
            loop {
                if(count < self.lst_num.read()) {
                    let curr_addr = self.lst_addresses.read(count);
                    let lst_amt = IERC4626Dispatcher {contract_address: curr_addr}
                    .convert_to_shares(token_amount);
                    ERC20Helper::strict_transfer_from(curr_addr, caller, this, lst_amt);
                    count += 1;
                } else {
                    break;
                }
            };
            self.reng.end();
        }

        fn request_withdrawal(ref self:ContractState,asset:ContractAddress,lst_amount:u256,receiver:ContractAddress){
            let caller = get_caller_address();
            let this = get_contract_address();
            assert(caller == self.vault.read(),'Only vault can call');
            ERC20Helper::strict_transfer_from(asset, this, receiver, lst_amount);
        }

        fn vault_init(ref self:ContractState,vault_:ContractAddress){
            self.ownable.assert_only_owner();
            self.vault.write(vault_);
        }
    }
}