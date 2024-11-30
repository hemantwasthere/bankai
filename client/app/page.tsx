import Navbar from "@/components/navbar";
import Swap from "@/components/swap";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-[#1A1A2D]">
      <Navbar />

      <div className="m-auto flex h-full w-full max-w-xl items-center justify-center">
        <Swap />
      </div>
    </div>
  );
}
