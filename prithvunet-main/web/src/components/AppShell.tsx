"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

function isShellFreePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/login" || pathname === "/unauthorized" || pathname.startsWith("/citizen");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shellFree = isShellFreePath(pathname);

  return (
    <>
      {!shellFree && <Sidebar />}
      <main className={shellFree ? "min-h-screen bg-[#06080d]" : "min-h-screen bg-[#06080d] lg:pl-[260px]"}>
        {children}
      </main>
    </>
  );
}