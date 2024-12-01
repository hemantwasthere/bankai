"use client";

import { motion } from "framer-motion";

import AddLiquid from "@/components/add-liquid";
import Navbar from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WithdrawLiquid from "@/components/withdraw-liquid";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-[#1A1A2D]">
      <Navbar />

      <motion.div
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="m-auto flex h-full w-full max-w-xl items-center justify-center"
      >
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="mb-3 space-x-3 bg-transparent">
            <TabsTrigger
              value="add"
              className="w-[8.5rem] border-[#2E2E3F] data-[state=active]:border data-[state=active]:bg-[#262638] data-[state=active]:text-[#D4D4D7]"
            >
              Add liquidity
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              className="w-[11rem] border-[#2E2E3F] data-[state=active]:border data-[state=active]:bg-[#262638] data-[state=active]:text-[#D4D4D7]"
            >
              Withdraw liquidity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="add">
            <AddLiquid />
          </TabsContent>
          <TabsContent value="remove">
            <WithdrawLiquid />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
