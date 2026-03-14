"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Factory,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { useIndustry } from "@/components/IndustryContext";

interface IndustryPanelProps {
  variant?: "drawer" | "page";
}

function statusPill(status: string, color: string) {
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: color }}>
      {status}
    </span>
  );
}

function formatDateTime(value: string) {
  if (!value) {
    return "Not available";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_OPTIONS: Array<{ value: "" | "Violation" | "Compliant" | "Unknown"; label: string }> = [
  { value: "", label: "All" },
  { value: "Violation", label: "Violation" },
  { value: "Compliant", label: "Compliant" },
  { value: "Unknown", label: "Unknown" },
];

export default function IndustryPanel({ variant = "drawer" }: IndustryPanelProps) {
  const {
    apiError,
    apiSource,
    categories,
    clearFilters,
    closePanel,
    filters,
    industries,
    loadingList,
    loadingStats,
    page,
    panelOpen,
    refreshIndustryData,
    selectedIndustryId,
    selectIndustry,
    setPage,
    states,
    stats,
    total,
    totalPages,
    updateFilters,
    warmingCompliance,
  } = useIndustry();

  const summaryCards = [
    {
      key: "total",
      label: "Total",
      value: stats?.totalIndustries || 0,
      accent: "text-zinc-100",
      icon: <Factory size={14} className="text-zinc-300" />,
    },
    {
      key: "compliant",
      label: "Compliant",
      value: stats?.complianceSummary.Compliant || 0,
      accent: "text-emerald-200",
      icon: <CircleCheckBig size={14} className="text-emerald-300" />,
    },
    {
      key: "violations",
      label: "Violations",
      value: stats?.complianceSummary.Violation || 0,
      accent: "text-red-200",
      icon: <ShieldAlert size={18} className="text-red-300" />,
    },
    {
      key: "unknown",
        label: "Pending",
      value: stats?.complianceSummary.Unknown || 0,
      accent: "text-amber-100",
      icon: <AlertTriangle size={18} className="text-amber-200" />,
    },
  ];

  const panelClasses =
    variant === "page"
      ? "relative mx-auto flex w-full max-w-[1400px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#07101d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.28)]"
      : `fixed inset-y-0 right-0 z-[1200] flex w-full max-w-[26rem] flex-col border-l border-white/10 bg-[#060b14]/96 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`;

  return (
    <aside className={panelClasses}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Industry Monitor</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Simple View</h2>
          <p className="mt-1 text-xs text-zinc-500">Source: {apiSource}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshIndustryData()}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <RefreshCw size={15} />
          </button>
          {variant === "drawer" ? (
            <button
              type="button"
              onClick={closePanel}
              className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {apiError ? (
          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {apiError}
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.key} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>{card.label}</span>
                <span>{card.icon}</span>
              </div>
              <p className={`text-xl font-semibold ${card.accent}`}>
                {loadingStats ? "..." : card.value.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-zinc-300">
          <div className="flex items-center justify-between gap-2">
            <span>
              Compliance evaluated for {stats?.complianceCoverage.evaluated.toLocaleString("en-IN") || 0} of {stats?.totalIndustries.toLocaleString("en-IN") || 0} industries
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px]">
              {stats?.complianceCoverage.coveragePercent?.toFixed(2) || "0.00"}%
            </span>
          </div>
          {warmingCompliance ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100">
              <Loader2 size={12} className="animate-spin" /> Running live compliance scan from RTDMS details...
            </div>
          ) : null}
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search industry, city, or address"
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400/30"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={filters.state}
              onChange={(event) => updateFilters({ state: event.target.value })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(event) => updateFilters({ category: event.target.value })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => updateFilters({ status: option.value })}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  filters.status === option.value
                    ? "bg-emerald-500/20 text-emerald-100"
                    : "text-zinc-300 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span>{total.toLocaleString("en-IN")} industries matched</span>
            <button type="button" onClick={clearFilters} className="text-zinc-300 transition hover:text-white">
              Clear filters
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-100">
          Violation logic: if any tracked pollutant value exceeds its configured limit for an industry, the industry status is marked as Violation.
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-zinc-500">
            <span>Industries</span>
            <span>{loadingList ? "Loading..." : `${industries.length} on this page`}</span>
          </div>

          {loadingList ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="industry-shimmer rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-white/10" />
                  <div className="mt-4 h-3 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : industries.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-400">
              No industries matched the current filters.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {industries.map((industry) => (
                <div
                  key={industry.id}
                  className={`border-l-2 px-4 py-3 transition hover:bg-white/[0.05] ${
                    selectedIndustryId === industry.id ? "bg-white/[0.05]" : ""
                  }`}
                  style={{ borderLeftColor: industry.complianceColor }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{industry.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {industry.city}, {industry.state}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{industry.category || "Unknown category"}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">Updated: {formatDateTime(industry.lastDataTime)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusPill(industry.complianceStatus, industry.complianceColor)}
                      <button
                        type="button"
                        onClick={() => void selectIndustry(industry.id)}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/15"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}