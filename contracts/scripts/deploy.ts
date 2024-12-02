import { provider, get_owner, owner_account_address,  path } from "./helper";
import { byteArray, uint256, CallData, number} from "starknet";

async function get_callData(name: 'swap') {
  let data: any;
  let lstData: {
    lst_id: any;
    token_address: string;
    fees: {
      input_fee: any;
      output_fee: any;
    }
  }[] = [
    {
      lst_id: uint256.bnToUint256(0),
      token_address: '0x042de5b868da876768213c48019b8d46cd484e66013ae3275f8a4b97b31fc7eb',
      fees: {
        input_fee: uint256.bnToUint256(10),
        output_fee:uint256.bnToUint256(0)
      }
    },{
      lst_id: uint256.bnToUint256(1),
      token_address: '0x01105049a29f16c5bb039d5d640964b9f25386d86eca26e70690d01d6127a266',
      fees: {
        input_fee: uint256.bnToUint256(10),
        output_fee: uint256.bnToUint256(0)
      }
    },{
      lst_id: uint256.bnToUint256(2),
      token_address: '0x0524c3065ce314f2515e0fc29b6031e20d23bb202350c17485c9b921251155a4',
      fees: {
        input_fee: uint256.bnToUint256(10),
        output_fee: uint256.bnToUint256(0)
      }
    },{
      lst_id: uint256.bnToUint256(3),
      token_address: '0x066dd665ce12b302e239c3cbf708a9444b3458271dd31596341d4e3e649ae04b',
      fees: {
        input_fee: uint256.bnToUint256(10),
        output_fee: uint256.bnToUint256(0)
      }
    }
  ]
  let lstAddresses = ['0x042de5b868da876768213c48019b8d46cd484e66013ae3275f8a4b97b31fc7eb',
     '0x01105049a29f16c5bb039d5d640964b9f25386d86eca26e70690d01d6127a266',
     '0x0524c3065ce314f2515e0fc29b6031e20d23bb202350c17485c9b921251155a4',
     '0x066dd665ce12b302e239c3cbf708a9444b3458271dd31596341d4e3e649ae04b']
    if (name === 'swap') {
    data = {
      owner: owner_account_address,
      fee_constant: uint256.bnToUint256(10),
      fee_collector: owner_account_address,
      min_liquidity: uint256.bnToUint256(100),
      max_liquidity: uint256.bnToUint256(2500),
      lst_data:lstData,
      lst_addresses: lstAddresses
    };
  }
  return data;
}

async function deployContract(name: 'swap') {
  const class_hash = '0x7f2826f036b4e8c51517dd5a301482f43cc630397fb229652970cc93d94c78e';
  const { transaction_hash, contract_address } = await get_owner().deploy({
    classHash: class_hash,
    constructorCalldata: await get_callData(name)
  });
  await provider.waitForTransaction(transaction_hash);
  const [contractAddress] = contract_address;

  console.log(
    `✅ ${name} contract deployed at = "${contractAddress}"`
  );
}

if (require.main === module) {
  deployContract('swap');
}