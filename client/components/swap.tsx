"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useBalance, useConnect } from "@starknet-react/core";
import { Info } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import {
  connect,
  ConnectOptionsWithConnectors,
  StarknetkitConnector,
} from "starknetkit";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NETWORK, STRK_TOKEN_SEPOLIA } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { cn, formatNumberWithCommas } from "@/lib/utils";

import { Icons } from "./Icons";
import { getConnectors } from "./navbar";

const formSchema = z.object({
  swapAmount: z.string().refine(
    (v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0 && n > 0;
    },
    { message: "Invalid input" },
  ),
});

export type FormValues = z.infer<typeof formSchema>;

const Swap: React.FC = () => {
  const [selectedToken, setSelectedToken] = React.useState("xstrk");
  const [swapToken, setSwapToken] = React.useState("sstrk");

  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: STRK_TOKEN_SEPOLIA,
  });
  const { connect: connectSnReact } = useConnect();

  const { isMobile } = useSidebar();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      swapAmount: "",
    },
    mode: "onChange",
  });

  const connectorConfig: ConnectOptionsWithConnectors = React.useMemo(() => {
    return {
      modalMode: "canAsk",
      modalTheme: "dark",
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

  const handleQuickStakePrice = (percentage: number) => {
    if (!address) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    if (balance && percentage === 100) {
      if (Number(balance?.formatted) < 1) {
        form.setValue("swapAmount", "0");
        form.clearErrors("swapAmount");
        return;
      }

      form.setValue("swapAmount", (Number(balance?.formatted) - 1).toString());
      form.clearErrors("swapAmount");
      return;
    }

    if (balance) {
      form.setValue(
        "swapAmount",
        ((Number(balance?.formatted) * percentage) / 100).toString(),
      );
      form.clearErrors("swapAmount");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (Number(values.swapAmount) > Number(balance?.formatted)) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient balance
          </div>
        ),
      });
    }

    if (!address) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    // const call1 = contractSTRK.populate("approve", [
    //   contract.address,
    //   MyNumber.fromEther(values.stakeAmount, 18),
    // ]);

    // if (referrer) {
    //   const call2 = contract.populate("deposit_with_referral", [
    //     MyNumber.fromEther(values.stakeAmount, 18),
    //     address,
    //     referrer,
    //   ]);
    //   await sendAsync([call1, call2]);
    // } else {
    //   const call2 = contract.populate("deposit", [
    //     MyNumber.fromEther(values.stakeAmount, 18),
    //     address,
    //   ]);
    //   await sendAsync([call1, call2]);
    // }
  };

  return (
    <div className="h-fit w-full rounded-xl border border-[#303054] bg-[#262638] px-6 py-3">
      <div className="mt-3">
        <h4 className="text-xl font-semibold text-white">Trade LSTs</h4>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Buy and sell your favourite LSTs
        </p>
      </div>

      <div className="mt-4 flex w-full flex-col items-start rounded-xl rounded-b-none bg-[#1A1A2D] p-4 pb-8 lg:gap-2">
        <div className="mb-3 flex w-full items-center justify-between">
          <Select
            value={selectedToken}
            onValueChange={setSelectedToken}
            defaultValue="xstrk"
          >
            <SelectTrigger className="w-fit gap-1.5 border-0 text-white/60 focus:ring-0">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent className="border-[#2F2F3F] bg-[#222233] text-[#A7A7AD]">
              <SelectGroup className="space-y-0.5">
                <SelectLabel className="text-xs text-muted-foreground">
                  LST tokens
                </SelectLabel>
                <SelectItem
                  value="xstrk"
                  className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                    "!bg-[#2F2F3F] !text-white/80": selectedToken === "xstrk",
                  })}
                >
                  xSTRK
                </SelectItem>
                <SelectItem
                  value="sstrk"
                  className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                    "!bg-[#2F2F3F] !text-white/80": selectedToken === "sstrk",
                  })}
                >
                  sSTRK
                </SelectItem>
                <SelectItem
                  value="nststrk"
                  className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                    "!bg-[#2F2F3F] !text-white/80": selectedToken === "nststrk",
                  })}
                >
                  nstSTRK
                </SelectItem>
                <SelectItem
                  value="zend"
                  className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                    "!bg-[#2F2F3F] !text-white/80": selectedToken === "zend",
                  })}
                >
                  zend
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <>
            <div className="hidden text-[#8D9C9C] lg:block">
              <button
                onClick={() => handleQuickStakePrice(100)}
                className="rounded-xl border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
              >
                Max
              </button>
            </div>

            <button
              onClick={() => handleQuickStakePrice(100)}
              className="rounded-md bg-[#BBE7E7] px-2 py-1 text-xs font-semibold text-[#215959] transition-all hover:bg-[#BBE7E7] hover:opacity-80 lg:hidden"
            >
              Max
            </button>
          </>
        </div>

        <div className="w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="swapAmount"
                render={({ field }) => (
                  <FormItem className="relative space-y-1">
                    <FormControl>
                      <div className="relative">
                        <Input
                          className={cn(
                            "mx-auto h-fit max-w-[160px] border-none px-0 pr-1 text-center text-2xl text-white/80 shadow-none outline-none placeholder:text-[#7F8287] focus-visible:ring-0 lg:pr-0 lg:!text-3xl",
                            {
                              "max-w-[250px]":
                                form.watch("swapAmount")?.length > 9,
                              "max-w-[360px]":
                                form.watch("swapAmount")?.length > 12,
                              "max-w-[420px]":
                                form.watch("swapAmount")?.length > 15,
                              "max-w-[500px]":
                                form.watch("swapAmount")?.length > 18,
                              "max-w-[520px]":
                                form.watch("swapAmount")?.length > 21,
                            },
                          )}
                          placeholder="0 xSTRK"
                          {...field}
                        />
                        <p className="mx-auto w-fit border-none text-sm text-[#7F8287]">
                          ≈ <span className="mr-[1px]">$</span>
                          {form.watch("swapAmount")}
                        </p>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>

      <div className="relative w-full">
        <div className="h-0.5 rounded-xl bg-[#262638]" />
        <button className="absolute -top-[18px] left-1/2 flex -translate-x-1/2 items-center justify-center rounded-xl border-[3px] border-[#262638] bg-[#1A1A2D] p-1.5 transition-all hover:bg-[#1e1e34]">
          <Icons.swap className="size-5 text-white/60" />
        </button>
      </div>

      <div className="flex w-full items-center justify-between rounded-xl rounded-t-none bg-[#1A1A2D] p-4 pt-6 lg:gap-2">
        <Select
          value={swapToken}
          onValueChange={setSwapToken}
          defaultValue="sstrk"
        >
          <SelectTrigger className="w-fit gap-1.5 border-0 text-white/60 focus:ring-0">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent className="border-[#2F2F3F] bg-[#222233] text-[#A7A7AD]">
            <SelectGroup className="space-y-0.5">
              <SelectLabel className="text-xs text-muted-foreground">
                LST tokens
              </SelectLabel>
              <SelectItem
                value="xstrk"
                className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                  "!bg-[#2F2F3F] !text-white/80": swapToken === "xstrk",
                })}
              >
                xSTRK
              </SelectItem>
              <SelectItem
                value="sstrk"
                className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                  "!bg-[#2F2F3F] !text-white/80": swapToken === "sstrk",
                })}
              >
                sSTRK
              </SelectItem>
              <SelectItem
                value="nststrk"
                className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                  "!bg-[#2F2F3F] !text-white/80": swapToken === "nststrk",
                })}
              >
                nstSTRK
              </SelectItem>
              <SelectItem
                value="zend"
                className={cn("hover:!bg-[#2F2F3F] hover:!text-white/80", {
                  "!bg-[#2F2F3F] !text-white/80": swapToken === "zend",
                })}
              >
                zend
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex flex-col items-end">
          <span className="text-white/80">0.968062567 xSTRK</span>
          <span className="text-xs text-[#F25E35]">
            ≈ <span className="mr-[1px]">$</span>
            920390
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <div className="flex items-center gap-1">
            You will get
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  This fee applies exclusively to your staking rewards and does
                  NOT affect your staked amount. You might qualify for a future
                  fee rebate.{" "}
                  <Link
                    target="_blank"
                    href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
                    className="text-blue-600 underline"
                  >
                    Learn more
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>
            {form.watch("swapAmount")
              ? formatNumberWithCommas(Number(form.watch("swapAmount")))
              : 0}{" "}
            xSTRK
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <div className="flex items-center gap-1">
            Exchange rate
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  This fee applies exclusively to your staking rewards and does
                  NOT affect your staked amount. You might qualify for a future
                  fee rebate.{" "}
                  <Link
                    target="_blank"
                    href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
                    className="text-blue-600 underline"
                  >
                    Learn more
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <span>1 STRK = 1.2 xSTRK</span>
        </div>

        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <div className="flex items-center gap-1">
            Swap fee
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  This fee applies exclusively to your staking rewards and does
                  NOT affect your staked amount. You might qualify for a future
                  fee rebate.{" "}
                  <Link
                    target="_blank"
                    href="https://blog.endur.fi/endur-reimagining-value-distribution-in-liquid-staking-on-starknet"
                    className="text-blue-600 underline"
                  >
                    Learn more
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <span>0.01%</span>
        </div>
      </div>

      <div className="mb-2 mt-6">
        {!address && (
          <Button
            onClick={() => connectWallet()}
            className="w-full rounded-lg bg-[#395C6A] py-6 text-sm font-semibold text-white/80 transition-all hover:bg-[#34535f] hover:text-white/90 disabled:bg-[#557c8d] disabled:text-white/50 disabled:opacity-80"
          >
            Connect Wallet
          </Button>
        )}

        {address && (
          <Button
            type="submit"
            disabled={
              Number(form.getValues("swapAmount")) <= 0 ||
              isNaN(Number(form.getValues("swapAmount")))
                ? true
                : false
            }
            onClick={form.handleSubmit(onSubmit)}
            className="w-full rounded-lg bg-[#395C6A] py-6 text-sm font-semibold text-white/80 transition-all hover:bg-[#34535f] hover:text-white/90 disabled:bg-[#557c8d] disabled:text-white/50 disabled:opacity-80"
          >
            Buy xSTRK
          </Button>
        )}
      </div>
    </div>
  );
};

export default Swap;
