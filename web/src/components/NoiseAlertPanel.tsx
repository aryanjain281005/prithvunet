"use client";

import { AlertTriangle, Bell, ChevronRight, Clock, MapPin } from "lucide-react";

import { useNoise } from "./NoiseContext";
import type { NoiseAlert, NoiseStation } from "../lib/noiseTypes";

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/[0.08]", text: "text-red-300", border: "border-red-500/25" },
  HIGH: { bg: "bg-orange-500/[0.08]", text: "text-orange-300", border: "border-orange-500/25" },
  MODERATE: { bg: "bg-amber-500/[0.08]", text: "text-amber-200", border: "border-amber-500/20" },
};

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function AlertRow({ alert }: { alert: NoiseAlert }) {
  const { stations, setSelectedStation } = useNoise();
  const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.MODERATE;

  const handleClick = () => {
    const station = stations.find((candidate: NoiseStation) => candidate.station_id === alert.station_id) ?? null;
    setSelectedStation(station);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-2xl border p-3.5 text-left transition hover:brightness-110 ${style.bg} ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.text}`}>
              {alert.severity}
            </span>
            <p className="truncate text-[13px] font-medium text-zinc-100">{alert.station_name}</p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} />
              {alert.city} · {alert.zone}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {formatTime(alert.last_updated)}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
              {alert.source_label}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-zinc-300">
            {alert.laf.toFixed(1)} dB(A) vs {alert.threshold} dB ({alert.period.toLowerCase()}) · +{alert.exceeded_by} dB
          </p>
        </div>
        <ChevronRight size={14} className="shrink-0 text-zinc-600" />
      </div>
    </button>
  );
}

export default function NoiseAlertPanel() {
  const { stats, loading } = useNoise();
  const alerts = stats?.active_alerts ?? [];

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((value) => (
          <div key={value} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-red-400" />
          <span className="text-sm font-semibold text-white">Active Alerts</span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-300">
          {alerts.length} active
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <AlertTriangle size={20} className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300">All clear</p>
          <p className="mt-1 text-xs text-zinc-500">No stations exceed current CPCB noise limits.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {alerts.map((alert: NoiseAlert) => (
            <AlertRow key={alert.station_id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}