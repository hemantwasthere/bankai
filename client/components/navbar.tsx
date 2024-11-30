"use client";

import {
  InjectedConnector,
  useAccount,
  useConnect,
  useDisconnect,
  useProvider,
  useSwitchChain,
} from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import { ChartPie, Menu, X } from "lucide-react";
import { Figtree } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import { constants, num } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  disconnect,
  StarknetkitConnector,
} from "starknetkit";
import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import { WebWalletConnector } from "starknetkit/webwallet";

import { getProvider, NETWORK } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { cn, shortAddress } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";

import { Icons } from "./Icons";
import { useSidebar } from "./ui/sidebar";

export const CONNECTOR_NAMES = ["Braavos", "Argent X", "Argent (mobile)"];

export function getConnectors(isMobile: boolean) {
  const mobileConnector = ArgentMobileConnector.init({
    options: {
      dappName: "Bankai",
      url: window.location.hostname,
      chainId: constants.NetworkName.SN_MAIN,
    },
    inAppBrowserOptions: {},
  }) as StarknetkitConnector;

  const argentXConnector = new InjectedConnector({
    options: {
      id: "argentX",
      name: "Argent X",
    },
  });

  const braavosConnector = new InjectedConnector({
    options: {
      id: "braavos",
      name: "Braavos",
    },
  });

  const webWalletConnector = new WebWalletConnector({
    url: "https://web.argent.xyz",
  }) as StarknetkitConnector;

  const isMainnet = NETWORK === constants.NetworkName.SN_MAIN;
  if (isMainnet) {
    if (isInArgentMobileAppBrowser()) {
      return [mobileConnector];
    } else if (isMobile) {
      return [mobileConnector, braavosConnector, webWalletConnector];
    }
    return [
      argentXConnector,
      braavosConnector,
      mobileConnector,
      webWalletConnector,
    ];
  }
  return [argentXConnector, braavosConnector];
}

const Navbar = ({ className }: { className?: string }) => {
  const { address, connector, chainId } = useAccount();
  const { provider } = useProvider();
  const { connect: connectSnReact } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);
  const setProvider = useSetAtom(providerAtom);

  const { isMobile } = useSidebar();

  const connectorConfig: ConnectOptionsWithConnectors = useMemo(() => {
    return {
      modalMode: "canAsk",
      modalTheme: "light",
      webWalletUrl: "https://web.argent.xyz",
      argentMobileOptions: {
        dappName: "Bankai",
        chainId: NETWORK,
        url: window.location.hostname,
      },
      dappName: "Bankai",
      connectors: getConnectors(isMobile) as StarknetkitConnector[],
    };
  }, [isMobile]);

  const requiredChainId = useMemo(() => {
    return NETWORK == constants.NetworkName.SN_MAIN
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA;
  }, []);

  const { switchChain, error } = useSwitchChain({
    params: {
      chainId: requiredChainId,
    },
  });

  async function connectWallet(config = connectorConfig) {
    try {
      const { connector } = await connect(config);

      if (connector) {
        connectSnReact({ connector: connector as any });
      }
    } catch (error) {
      console.error("connectWallet error", error);
    }
  }

  // switch chain if not on the required chain
  React.useEffect(() => {
    if (
      chainId &&
      chainId.toString() !== num.getDecimalString(requiredChainId)
    ) {
      switchChain();
    }
  }, [chainId]);

  React.useEffect(() => {
    if (error) {
      console.error("switchChain error", error);
    }
  }, [error]);

  // attempt to connect wallet on load
  React.useEffect(() => {
    const config = connectorConfig;
    connectWallet({
      ...config,
      modalMode: "neverAsk",
    });
  }, []);

  React.useEffect(() => {
    if (connector) {
      const name: string = connector.name;
      setLastWallet(name);
    }
  }, [connector]);

  React.useEffect(() => {
    setAddress(address);
    setProvider(getProvider());
  }, [address, provider]);

  return (
    <header
      className={cn(
        "flex w-full items-center justify-end p-3",
        {
          "justify-between": isMobile,
        },
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#303054] text-sm font-bold text-white/70 focus-visible:outline-white",
            {
              "h-[34px]": isMobile,
            },
          )}
          onClick={() => !address && connectWallet()}
        >
          {!address && (
            <p
              className={cn(
                "relative flex w-[9.5rem] select-none items-center justify-center gap-1 bg-transparent text-sm",
              )}
            >
              Connect Wallet
            </p>
          )}

          {address && (
            <>
              {!isMobile ? (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({
                        description: "Address copied to clipboard",
                      });
                    }}
                    className="flex h-9 items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.gradient />
                    <p className="flex items-center gap-1 text-sm">
                      {address && shortAddress(address, 4, 4)}
                    </p>
                  </button>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-white/70"
                  />
                </div>
              ) : (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({ description: "Address copied to clipboard" });
                    }}
                    className="flex w-fit items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.wallet className="size-5 text-white/70" />
                    {shortAddress(address, 4, 4)}
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-white/70"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
