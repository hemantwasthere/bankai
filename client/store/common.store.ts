import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Provider } from "starknet";

export const providerAtom = atom<Provider | null>(null);

export const currentBlockAtom = atom(async (get) => {
  const provider = get(providerAtom);

  // plus 1 to represent pending block
  return provider ? (await provider.getBlockNumber()) + 1 : 0;
});

export const userAddressAtom = atom<string | undefined>();

export const strkPriceAtom = atomWithQuery((get) => {
  return {
    queryKey: ["strkPrice"],
    queryFn: async ({ queryKey }: any): Promise<number> => {
      try {
        const data = await fetch("https://app.strkfarm.xyz/api/price/STRK");
        const { price } = await data.json();
        return price;
      } catch (error) {
        console.error("strkPriceAtom", error);
        return 0;
      }
    },
    refetchInterval: 60000,
  };
});

export const lastWalletAtom = createAtomWithStorage<null | string>(
  "BANKAI_LAST_WALLET",
  null,
);

export function createAtomWithStorage<T>(
  key: string,
  defaultValue: T,
  getter?: (key: string, initialValue: T) => PromiseLike<T>,
) {
  const ISSERVER = typeof window === "undefined";
  let localStorage: any;

  let storageConfig = createJSONStorage<T>(() => {
    if (!ISSERVER) return localStorage;
    return null;
  });

  if (getter) {
    storageConfig = { ...storageConfig, getItem: getter };
  }

  return atomWithStorage<T>(key, defaultValue, storageConfig, {
    getOnInit: true,
  });
}
