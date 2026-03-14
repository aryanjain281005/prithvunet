"use client";

import { AlertTriangle, Camera, Radio, Volume2 } from "lucide-react";

import type { NoiseStation } from "../lib/noiseTypes";

interface Props {
  station: NoiseStation;
  isSelected: boolean;
  onClick: () => void;
}

const ZONE_BADGE: Record<string, string> = {
  Industrial: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  Commercial: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Residential: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
  Silence: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
};

const SOURCE_BADGE = {
  live: {
    Icon: Radio,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  snapshot: {
    Icon: Camera,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  },
  simulated: {
    Icon: AlertTriangle,
    className: "border-orange-500/25 bg-orange-500/10 text-orange-200",
  },
} as const;

function formatTimestamp(value: string): string {
  try {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function severityLabel(severity: NoiseStation["compliance"]["severity"]): string {
  if (severity === "OK") return "COMPLIANT";
  return severity;
}

export default function NoiseStationCard({ station, isSelected, onClick }: Props) {
  const sourceStyle = SOURCE_BADGE[station.source];
  const SourceIcon = sourceStyle.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] ${
        isSelected
          ? "border-white/20 bg-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-white">{station.name}</p>
          <p className="mt-1 text-xs text-zinc-500">{station.city}, {station.state}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${sourceStyle.className}`}>
            <SourceIcon size={10} />
            {station.source_label}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${ZONE_BADGE[station.zone] ?? "border-white/10 bg-white/[0.04] text-zinc-300"}`}>
            {station.zone}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">LAF</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight" style={{ color: station.compliance.color }}>
              {station.laf?.toFixed(1) ?? "—"}
            </span>
            <span className="pb-1 text-xs text-zinc-500">dB(A)</span>
          </div>
        </div>

        <div
          className="rounded-2xl px-3 py-2 text-right text-xs font-semibold"
          style={{ backgroundColor: `${station.compliance.color}1A`, color: station.compliance.color }}
        >
          <p>{station.compliance.status === "Compliant" ? "COMPLIANT" : "VIOLATION"}</p>
          <p className="mt-1 text-[11px] text-zinc-200">
            {station.compliance.status === "Compliant"
              ? `${station.compliance.period} limit ${station.compliance.threshold} dB`
              : `+${station.compliance.exceeded_by} dB over ${station.compliance.period.toLowerCase()} limit`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">LAS</p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">{station.las?.toFixed(1) ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">LPeak</p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">{station.lpeak?.toFixed(1) ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Severity</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: station.compliance.color }}>
            {severityLabel(station.compliance.severity)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <Volume2 size={12} />
          {station.source_detail}
        </span>
        <span>Updated {formatTimestamp(station.last_updated)}</span>
      </div>
    </button>
  );
}