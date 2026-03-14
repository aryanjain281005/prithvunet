"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  Camera,
  Filter,
  Radio,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";

import NoiseAlertPanel from "../../components/NoiseAlertPanel";
import { NoiseProvider, useNoise } from "../../components/NoiseContext";
import NoiseStationCard from "../../components/NoiseStationCard";
import NoiseStatusBanner from "../../components/NoiseStatusBanner";
import NoiseStationDetail from "../../components/NoiseStationDetail";
import type { NoiseFilter, NoiseStation } from "../../lib/noiseTypes";

const NoiseMap = dynamic(() => import("../../components/NoiseMap"), { ssr: false });

function StatPill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`rounded-lg p-1.5 ${color.replace("text-", "bg-").replace("-300", "-500/10").replace("-200", "-500/10")}`}>
          {icon}
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

const ZONES = ["Industrial", "Commercial", "Residential", "Silence"];
const COMPLIANCES = ["Compliant", "Violation"];

function FilterBar() {
  const { filter, setFilter, filteredStations, stations, stats } = useNoise();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search station, city, state..."
          value={filter.searchQuery}
          onChange={(event) => setFilter((previous: NoiseFilter) => ({ ...previous, searchQuery: event.target.value }))}
          className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-white/20 focus:bg-white/[0.06]"
        />
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <Filter size={12} className="ml-1 text-zinc-600" />
        {ZONES.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => setFilter((previous: NoiseFilter) => ({ ...previous, zone: previous.zone === zone ? "" : zone }))}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filter.zone === zone ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {COMPLIANCES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter((previous: NoiseFilter) => ({ ...previous, compliance: previous.compliance === status ? "" : status }))}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
              filter.compliance === status
                ? status === "Compliant"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/50 bg-red-500/10 text-red-300"
                : "border-white/10 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <span className="text-xs text-zinc-500">{filteredStations.length}/{stations.length} stations</span>
      {stats && (
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-300">
          {stats.period} limits active
        </span>
      )}
    </div>
  );
}

function NoiseDashboardContent() {
  const { stats, filteredStations, loading, selectedStation, setSelectedStation, refreshing, refresh, lastUpdated } = useNoise();

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-zinc-500">Hackathon fallback monitor</p>
          <h1 className="flex items-center gap-3 text-[28px] font-semibold tracking-tight text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Volume2 size={18} className="text-orange-300" />
            </span>
            Noise Pollution Monitor
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            3-layer fallback: CORS proxy → snapshot API → seeded simulation · 10 benchmark stations · 60-second auto-refresh
          </p>
        </div>

        {stats && (
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300">
            {stats.status_mode === "live" ? "Live path active" : stats.status_mode === "snapshot" ? "Snapshot fallback active" : "Simulation fallback active"}
          </div>
        )}
      </div>

      {stats && (
        <NoiseStatusBanner
          stats={stats}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}

      {loading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatPill label="Total Stations" value={stats.total_stations} sub="benchmark set" color="text-zinc-100" icon={<Volume2 size={14} className="text-zinc-300" />} />
          <StatPill label="Live Path" value={stats.live} sub="proxy success" color="text-emerald-300" icon={<Radio size={14} className="text-emerald-300" />} />
          <StatPill label="Snapshot Path" value={stats.snapshot} sub="layer 2 fallback" color="text-amber-200" icon={<Camera size={14} className="text-amber-200" />} />
          <StatPill label="Simulated Path" value={stats.simulated} sub="layer 3 fallback" color="text-orange-200" icon={<Sparkles size={14} className="text-orange-200" />} />
          <StatPill label="Violations" value={stats.violation} sub={`${stats.critical} critical`} color={stats.violation > 0 ? "text-red-300" : "text-emerald-300"} icon={<AlertTriangle size={14} className={stats.violation > 0 ? "text-red-300" : "text-emerald-300"} />} />
          <StatPill label="Avg. LAF" value={stats.avg_laf_db !== null ? `${stats.avg_laf_db} dB` : "—"} sub={`${stats.compliant} compliant`} color="text-blue-300" icon={<Activity size={14} className="text-blue-300" />} />
        </div>
      ) : null}

      <FilterBar />

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass rounded-2xl p-0 xl:col-span-2" style={{ height: 420 }}>
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center rounded-2xl">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-300" />
              </div>
            }
          >
            <NoiseMap />
          </Suspense>
        </div>

        <div className="glass rounded-2xl p-5" style={{ height: 420, overflowY: "auto" }}>
          <NoiseAlertPanel />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Radio size={14} className="text-orange-300" />
          Benchmark Station Grid
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-200">{filteredStations.length}</span>
        </h2>
        {selectedStation && (
          <button
            type="button"
            onClick={() => setSelectedStation(null)}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear selection
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />
          ))}
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
            <Search size={24} className="text-orange-300" />
          </div>
          <p className="text-base font-medium text-zinc-300">No stations match your filters</p>
          <p className="mt-1 text-sm text-zinc-500">Try adjusting search, zone, or compliance filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredStations.map((station: NoiseStation) => (
            <NoiseStationCard
              key={station.station_id}
              station={station}
              isSelected={selectedStation?.station_id === station.station_id}
              onClick={() => setSelectedStation(selectedStation?.station_id === station.station_id ? null : station)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoisePage() {
  return (
    <NoiseProvider>
      <NoiseDashboardContent />
      <NoiseDetailDrawer />
    </NoiseProvider>
  );
}

function NoiseDetailDrawer() {
  const { selectedStation, setSelectedStation } = useNoise();
  if (!selectedStation) return null;

  return <NoiseStationDetail station={selectedStation} onClose={() => setSelectedStation(null)} />;
}