"use client";

import { motion } from "framer-motion";

import Navbar from "@/components/navbar";
import Swap from "@/components/swap";

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
        <Swap />
      </motion.div>
    </div>
  );
}
