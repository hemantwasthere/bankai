import { Account, json, RpcProvider } from "starknet";
import fs from "fs";
import { get_owner, path } from "./helper";
// D:\starkFarm\bankai\contracts\target\dev\bankai_contract_Swap.compiled_contract_class.json
export async function get_contract_class(name: 'swap') {
  const contract_path = "./contracts/target/dev/bankai_contract_Swap"
  const Sierra = json.parse(
    fs
      .readFileSync(`${contract_path}.contract_class.json`)
      .toString("ascii")
  );
  const Casm = json.parse(
    fs
      .readFileSync(
        `${contract_path}.compiled_contract_class.json`
      )
      .toString("ascii")
  );

  const declareResponse = await get_owner().declareIfNot({
    contract: Sierra,
    casm: Casm,
  });

  fs.appendFile(
    path,
    `\n${name}_CLASS_HASH = "${declareResponse.class_hash}"`,
    function (err: any) {
      if (err) throw err;
    }
  );

  return declareResponse.class_hash;
}

(async() =>{
  console.log(await get_contract_class('swap'));
})();
