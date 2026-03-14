"use client";

import IndustryMap from "@/components/IndustryMap";
import IndustryPanel from "@/components/IndustryPanel";
import IndustrySidebar from "@/components/IndustrySidebar";
import { IndustryProvider } from "@/components/IndustryContext";

export default function IndustriesPage() {
  return (
    <IndustryProvider>
      <div className="min-h-screen bg-[#060b14] px-4 py-6 lg:px-6">
        <div className="mx-auto mb-6 max-w-[1400px]">
          <h1 className="text-2xl font-semibold text-white">Industry Monitoring</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Clean, focused RTDMS monitoring with status filters, limited marker density, and one-click details.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <IndustryMap />
          <IndustryPanel variant="page" />
        </div>
        <IndustrySidebar />
      </div>
    </IndustryProvider>
  );
}