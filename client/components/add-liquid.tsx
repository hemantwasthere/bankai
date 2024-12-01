"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useBalance, useConnect } from "@starknet-react/core";
import { Info } from "lucide-react";
import { Figtree } from "next/font/google";
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
import { NETWORK, STRK_TOKEN_SEPOLIA, XSTRK_TOKEN_SEPOLIA } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { cn, formatNumberWithCommas } from "@/lib/utils";

import { Icons } from "./Icons";
import { getConnectors } from "./navbar";

const font = Figtree({
  subsets: ["latin-ext"],
});

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

const TOKENS = [
  {
    label: "xSTRK",
    value: "xstrk",
    icon: <Icons.endurLogo className="size-8" />,
    sepoliaAddress: XSTRK_TOKEN_SEPOLIA,
  },
  {
    label: "ySTRK",
    value: "ystrk",
    icon: <Icons.ySTRKLogo className="size-8" />,
    sepoliaAddress: STRK_TOKEN_SEPOLIA,
  },
  {
    label: "zSTRK",
    value: "zstrk",
    icon: <Icons.zSTRKLogo className="size-8" />,
    sepoliaAddress: STRK_TOKEN_SEPOLIA,
  },
  {
    label: "dSTRK",
    value: "dstrk",
    icon: <Icons.dSTRKLogo className="size-8" />,
    sepoliaAddress: STRK_TOKEN_SEPOLIA,
  },
];

const AddLiquid: React.FC = () => {
  const [depositToken, setDepositToken] = React.useState("xstrk");

  const { address } = useAccount();
  const { data: xSTRK_Balance, isPending: xSTRK_Balance_Pending } = useBalance({
    address,
    token: XSTRK_TOKEN_SEPOLIA,
  });
  const { data: sSTRK_Balance, isPending: sSTRK_Balance_Pending } = useBalance({
    address,
    token: STRK_TOKEN_SEPOLIA,
  });
  const { data: nstsSTRK_Balance, isPending: nstsSTRK_Balance_Pending } =
    useBalance({
      address,
      token: STRK_TOKEN_SEPOLIA,
    });
  const { data: Zend_Balance, isPending: Zend_Balance_Pending } = useBalance({
    address,
    token: STRK_TOKEN_SEPOLIA,
  });

  const selectedTokenBalance = React.useMemo(() => {
    switch (depositToken) {
      case "xstrk":
        return xSTRK_Balance;
      case "sstrk":
        return sSTRK_Balance;
      case "nststrk":
        return nstsSTRK_Balance;
      case "zend":
        return Zend_Balance;
      default:
        return xSTRK_Balance;
    }
  }, [
    depositToken,
    xSTRK_Balance,
    sSTRK_Balance,
    nstsSTRK_Balance,
    Zend_Balance,
  ]);

  const getTokenBalance = (token: string) => {
    if (
      xSTRK_Balance_Pending ||
      sSTRK_Balance_Pending ||
      nstsSTRK_Balance_Pending ||
      Zend_Balance_Pending
    ) {
      return {
        formatted: "0",
      };
    }

    switch (token) {
      case "xstrk":
        return xSTRK_Balance;
      case "sstrk":
        return sSTRK_Balance;
      case "nststrk":
        return nstsSTRK_Balance;
      case "zend":
        return Zend_Balance;
      default:
        return {
          formatted: "0",
        };
    }
  };

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

    if (selectedTokenBalance && percentage === 100) {
      if (Number(selectedTokenBalance?.formatted) < 1) {
        form.setValue("swapAmount", "0");
        form.clearErrors("swapAmount");
        return;
      }

      form.setValue(
        "swapAmount",
        (Number(selectedTokenBalance?.formatted) - 1).toString(),
      );
      form.clearErrors("swapAmount");
      return;
    }

    if (selectedTokenBalance) {
      form.setValue(
        "swapAmount",
        (
          (Number(selectedTokenBalance?.formatted) * percentage) /
          100
        ).toString(),
      );
      form.clearErrors("swapAmount");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (Number(values.swapAmount) > Number(selectedTokenBalance?.formatted)) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Insufficient selectedTokenBalance
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
        <h4 className="text-xl font-semibold text-white">Deposit LSTs</h4>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Add your LSTs to earn more
        </p>
      </div>

      <div className="mt-4 flex w-full flex-col items-start rounded-xl bg-[#1A1A2D] p-4 pb-8 lg:gap-2">
        <div className="mb-3 flex w-full items-center justify-between">
          <Select
            value={depositToken}
            onValueChange={setDepositToken}
            defaultValue="xstrk"
          >
            <SelectTrigger className="h-fit w-fit items-start border-0 py-0 text-white/60 focus:ring-0">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent className="w-56 border-[#2F2F3F] bg-[#222233] text-[#A7A7AD]">
              <SelectGroup className="space-y-0.5">
                <SelectLabel className="text-xs text-muted-foreground">
                  LST tokens
                </SelectLabel>
                {TOKENS.map((token) => (
                  <SelectItem
                    key={token.value}
                    value={token.value}
                    className={cn(
                      "gap-2 hover:!bg-[#2F2F3F] hover:!text-white/80",
                      {
                        "!bg-[#2F2F3F] !text-white/80":
                          depositToken === token.value,
                      },
                    )}
                  >
                    <div className="flex flex-row items-center gap-2">
                      {token.icon}
                      <div className="flex flex-col items-start">
                        {token.label}
                        <p
                          className={cn(
                            font.className,
                            "flex items-center gap-0.5 text-[11px] text-muted-foreground",
                          )}
                        >
                          {Number(
                            getTokenBalance(token.value)?.formatted,
                          ).toFixed(2)}
                          <span>{token.label}</span>
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <button
            onClick={() => handleQuickStakePrice(100)}
            className={cn(
              "rounded-xl border border-[#8D9C9C33] bg-[#8D9C9C33] px-2 py-0.5 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]",
              font.className,
            )}
          >
            Max
          </button>
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
                            font.className,
                            "mx-auto h-fit min-w-[180px] max-w-[160px] border-none px-0 pr-1 text-center text-2xl text-white/80 shadow-none outline-none placeholder:px-4 placeholder:text-center placeholder:text-[#7F8287] focus-visible:ring-0 lg:pr-0 lg:!text-3xl",
                            {
                              "text-start":
                                form.watch("swapAmount")?.length === 0,
                              "text-red-500":
                                form.formState.errors.swapAmount ||
                                Number(form.getValues("swapAmount")) >
                                  Number(selectedTokenBalance?.formatted),
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
                          placeholder={`0 ${
                            TOKENS.find((t) => t.value === depositToken)?.label
                          }`}
                          {...field}
                        />
                        <p
                          className={cn(
                            font.className,
                            "mx-auto w-fit border-none text-sm text-[#7F8287]",
                          )}
                        >
                          ≈ <span className="mr-[1px]">$</span>
                          {form.watch("swapAmount")
                            ? Number(form.watch("swapAmount")).toFixed(4)
                            : 0}
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

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-md text-xs font-medium text-[#939494] lg:text-[13px]">
          <div className="flex items-center gap-1">
            APY
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-[#3F6870] lg:text-[#8D9C9C]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-60 rounded-md border border-[#03624C] bg-white text-[#03624C]"
                >
                  todo
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className={font.className}>~ 20%</span>
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
            Deposit {TOKENS.find((t) => t.value === depositToken)?.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddLiquid;
