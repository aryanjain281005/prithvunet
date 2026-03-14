"use client";

import { AlertTriangle, BarChart2, Camera, Clock, MapPin, Radio, Volume2, X, Zap } from "lucide-react";

import { ZONE_LIMITS } from "../lib/ComplianceEngine";
import type { NoiseStation } from "../lib/noiseTypes";

const METRIC_LABELS: Record<string, { label: string; desc: string }> = {
  laf: { label: "LAF", desc: "Fast A-weighted (dBA)" },
  las: { label: "LAS", desc: "Slow A-weighted (dBA)" },
  lcf: { label: "LCF", desc: "Fast C-weighted (dBC)" },
  lcs: { label: "LCS", desc: "Slow C-weighted (dBC)" },
  lae: { label: "LAE", desc: "Sound Exposure A (dBA)" },
  lce: { label: "LCE", desc: "Sound Exposure C (dBC)" },
  lpeak: { label: "LPeak", desc: "Peak C-weighted (dBC)" },
  max: { label: "Max", desc: "Observed max (dBA)" },
  min: { label: "Min", desc: "Observed min (dBA)" },
  battery: { label: "Battery", desc: "Supply voltage (V)" },
};

const SOURCE_STYLE = {
  live: { Icon: Radio, className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  snapshot: { Icon: Camera, className: "border-amber-500/25 bg-amber-500/10 text-amber-200" },
  simulated: { Icon: AlertTriangle, className: "border-orange-500/25 bg-orange-500/10 text-orange-200" },
} as const;

interface Props {
  station: NoiseStation;
  onClose: () => void;
}

interface MetricRowProps {
  metric: string;
  value: number | null;
  isMain?: boolean;
  threshold?: number;
  color?: string;
}

function MetricRow({ metric, value, isMain, threshold, color }: MetricRowProps) {
  const meta = METRIC_LABELS[metric] ?? { label: metric.toUpperCase(), desc: "" };
  if (value === null || value === undefined) return null;

  const progress = threshold ? Math.min(100, Math.round((value / (threshold + 20)) * 100)) : null;

  return (
    <div className={`rounded-xl p-3 ${isMain ? "bg-white/[0.05]" : "bg-transparent"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-zinc-500">{meta.desc}</p>
          <p className={`font-semibold ${isMain ? "text-base text-white" : "text-sm text-zinc-300"}`}>{meta.label}</p>
        </div>
        <span className={`font-bold tabular-nums ${isMain ? "text-2xl" : "text-base"}`} style={{ color: color ?? "#e4e4e7" }}>
          {metric === "battery" ? `${value.toFixed(2)}V` : `${value.toFixed(1)} dB`}
        </span>
      </div>

      {progress !== null && color && (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: color }} />
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">Limit: {threshold} dB · {progress}% of limit</p>
        </>
      )}
    </div>
  );
}

function formatDateTime(value: string): string {
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

export default function NoiseStationDetail({ station, onClose }: Props) {
  const limits = ZONE_LIMITS[station.zone];
  const sourceStyle = SOURCE_STYLE[station.source];
  const SourceIcon = sourceStyle.Icon;

  return (
    <aside className="fixed inset-y-0 right-0 z-[1300] flex w-full max-w-[390px] flex-col border-l border-white/10 bg-[#060b14]/96 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Station Detail</p>
          <h2 className="mt-1 text-base font-semibold text-white">Noise Benchmark Monitor</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-300">
                <Volume2 size={11} /> Noise Station
              </div>
              <h3 className="text-lg font-semibold text-white">{station.name}</h3>
              <p className="mt-0.5 text-sm text-zinc-400">{station.city}, {station.state}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${sourceStyle.className}`}>
                <SourceIcon size={12} />
                {station.source_label}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: station.compliance.color }}>
                {station.compliance.severity === "OK" ? "COMPLIANT" : station.compliance.severity}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-zinc-500">Zone</p>
              <p className="mt-1 text-sm font-medium text-white">{station.zone}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-zinc-500">Data source</p>
              <p className="mt-1 text-sm font-medium text-white">{station.source_label}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-zinc-500">Day limit</p>
              <p className="mt-1 text-sm font-medium text-white">{limits.day} dB(A)</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-zinc-500">Night limit</p>
              <p className="mt-1 text-sm font-medium text-white">{limits.night} dB(A)</p>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              <MapPin size={12} className="text-zinc-500" />
              <div>
                <p className="text-zinc-500">Coordinates</p>
                <p className="mt-0.5 font-mono text-xs text-zinc-300">{station.lat.toFixed(5)}, {station.lng.toFixed(5)}</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              <Clock size={12} className="text-zinc-500" />
              <div>
                <p className="text-zinc-500">Last reading</p>
                <p className="mt-0.5 text-xs text-zinc-300">{formatDateTime(station.last_updated)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Source note</p>
          <p className="mt-2 text-xs leading-6 text-zinc-400">{station.source_detail}</p>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: `${station.compliance.color}40`, backgroundColor: `${station.compliance.color}10` }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: station.compliance.color }}>
            <Zap size={14} />
            {station.compliance.status === "Violation"
              ? `Noise violation · +${station.compliance.exceeded_by} dB`
              : `Compliant for ${station.compliance.period.toLowerCase()} limit`}
          </div>
          <p className="mt-1.5 text-xs text-zinc-300">
            LAF reading of {station.laf?.toFixed(1) ?? "—"} dB(A) vs {station.compliance.period.toLowerCase()} threshold of {station.compliance.threshold} dB(A).
          </p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            <BarChart2 size={11} /> Station Metrics
          </p>
          <div className="space-y-1">
            <MetricRow metric="laf" value={station.laf} isMain threshold={station.compliance.threshold} color={station.compliance.color} />
            <MetricRow metric="las" value={station.las} />
            <MetricRow metric="lcf" value={station.lcf} />
            <MetricRow metric="lcs" value={station.lcs} />
            <MetricRow metric="lae" value={station.lae} />
            <MetricRow metric="lce" value={station.lce} />
            <MetricRow metric="lpeak" value={station.lpeak} />
            <MetricRow metric="max" value={station.max} />
            <MetricRow metric="min" value={station.min} />
            <MetricRow metric="battery" value={station.battery} />
          </div>
        </div>
      </div>
    </aside>
  );
}