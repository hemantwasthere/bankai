import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono, Rubik } from "next/font/google";

import Providers from "@/components/providers";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bankai - Multi LST Pool on Starknet",
  description: "Bankai is a multi LST pool on Starknet.",
};

const font = IBM_Plex_Mono({
  subsets: ["latin-ext"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(font.className, "antialiased")}>
        <Providers>
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
