"use client";

import { AlertTriangle, Camera, Clock3, Radio, RefreshCw } from "lucide-react";

import type { NoiseSummary } from "@/lib/noiseTypes";

interface Props {
  stats: NoiseSummary;
  lastUpdated: string;
  refreshing: boolean;
  onRefresh: () => void;
}

const MODE_STYLES = {
  live: {
    border: "border-emerald-500/30",
    shell: "bg-emerald-500/[0.08]",
    iconShell: "bg-emerald-500/15 text-emerald-300",
    title: "text-emerald-200",
    Icon: Radio,
    headline: "Live data from CPCB NANMN network",
    description: "Real-time readings are flowing through the layer-1 proxy path.",
  },
  snapshot: {
    border: "border-amber-500/30",
    shell: "bg-amber-500/[0.08]",
    iconShell: "bg-amber-500/15 text-amber-200",
    title: "text-amber-100",
    Icon: Camera,
    headline: "Showing last snapshot from CPCB",
    description: "Live feed is temporarily unavailable, so the module is serving the last captured snapshot.",
  },
  simulated: {
    border: "border-orange-500/35",
    shell: "bg-orange-500/[0.08]",
    iconShell: "bg-orange-500/15 text-orange-200",
    title: "text-orange-100",
    Icon: AlertTriangle,
    headline: "CPCB feed pending IP authorization",
    description: "Showing baseline + simulated variation from last known real readings for hackathon continuity.",
  },
} as const;

function formatTimestamp(value: string): string {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function NoiseStatusBanner({ stats, lastUpdated, refreshing, onRefresh }: Props) {
  const style = MODE_STYLES[stats.status_mode];
  const Icon = style.Icon;

  return (
    <div className={`mb-6 rounded-3xl border ${style.border} ${style.shell} p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconShell}`}>
            <Icon size={20} />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Source Architecture</p>
            <h2 className={`mt-1 text-lg font-semibold ${style.title}`}>{style.headline}</h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-300">{style.description}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {stats.live} live
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {stats.snapshot} snapshot
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {stats.simulated} simulated
              </span>
            </div>

            {stats.status_mode === "simulated" && (
              <p className="mt-3 text-xs text-orange-200/90">
                Contact informatica@geonica.com to request CPCB noise feed authorization for your backend IP.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300">
            <Clock3 size={12} className="text-zinc-400" />
            Last refreshed {formatTimestamp(lastUpdated)}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}