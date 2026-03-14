"use client";

import { useState } from "react";
import { Ruler, Plus, Trash2, Edit, Wind, Droplets, Volume2, Thermometer } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface MonitoringUnit {
  id: string;
  parameter: string;
  symbol: string;
  unit: string;
  category: "air" | "water" | "noise";
  description: string;
}

interface PrescribedLimit {
  id: string;
  parameter: string;
  category: "air" | "water" | "noise";
  context: string;
  limit: number;
  unit: string;
  duration: string;
  source: string;
}

const INITIAL_UNITS: MonitoringUnit[] = [
  { id: "MU01", parameter: "PM₂.₅", symbol: "PM2.5", unit: "µg/m³", category: "air", description: "Particulate matter ≤2.5 microns" },
  { id: "MU02", parameter: "PM₁₀", symbol: "PM10", unit: "µg/m³", category: "air", description: "Particulate matter ≤10 microns" },
  { id: "MU03", parameter: "SO₂", symbol: "SO2", unit: "µg/m³", category: "air", description: "Sulphur Dioxide" },
  { id: "MU04", parameter: "NO₂", symbol: "NO2", unit: "µg/m³", category: "air", description: "Nitrogen Dioxide" },
  { id: "MU05", parameter: "CO", symbol: "CO", unit: "mg/m³", category: "air", description: "Carbon Monoxide" },
  { id: "MU06", parameter: "O₃", symbol: "O3", unit: "µg/m³", category: "air", description: "Ozone" },
  { id: "MU07", parameter: "NH₃", symbol: "NH3", unit: "µg/m³", category: "air", description: "Ammonia" },
  { id: "MU08", parameter: "BOD", symbol: "BOD", unit: "mg/L", category: "water", description: "Biochemical Oxygen Demand" },
  { id: "MU09", parameter: "DO", symbol: "DO", unit: "mg/L", category: "water", description: "Dissolved Oxygen" },
  { id: "MU10", parameter: "pH", symbol: "pH", unit: "", category: "water", description: "Power of Hydrogen" },
  { id: "MU11", parameter: "Temperature", symbol: "T", unit: "°C", category: "water", description: "Water Temperature" },
  { id: "MU12", parameter: "COD", symbol: "COD", unit: "mg/L", category: "water", description: "Chemical Oxygen Demand" },
  { id: "MU13", parameter: "Turbidity", symbol: "NTU", unit: "NTU", category: "water", description: "Nephelometric Turbidity" },
  { id: "MU14", parameter: "Nitrate", symbol: "NO3", unit: "mg/L", category: "water", description: "Nitrate concentration" },
  { id: "MU15", parameter: "Leq", symbol: "Leq", unit: "dB(A)", category: "noise", description: "Equivalent continuous noise level" },
  { id: "MU16", parameter: "Lmax", symbol: "Lmax", unit: "dB(A)", category: "noise", description: "Maximum noise level" },
  { id: "MU17", parameter: "Lmin", symbol: "Lmin", unit: "dB(A)", category: "noise", description: "Minimum noise level" },
];

const INITIAL_LIMITS: PrescribedLimit[] = [
  { id: "PL01", parameter: "PM₂.₅", category: "air", context: "Residential / General", limit: 60, unit: "µg/m³", duration: "24-hour avg", source: "NAAQS 2009" },
  { id: "PL02", parameter: "PM₂.₅", category: "air", context: "Annual standard", limit: 40, unit: "µg/m³", duration: "Annual avg", source: "NAAQS 2009" },
  { id: "PL03", parameter: "PM₁₀", category: "air", context: "Residential / General", limit: 100, unit: "µg/m³", duration: "24-hour avg", source: "NAAQS 2009" },
  { id: "PL04", parameter: "PM₁₀", category: "air", context: "Annual standard", limit: 60, unit: "µg/m³", duration: "Annual avg", source: "NAAQS 2009" },
  { id: "PL05", parameter: "SO₂", category: "air", context: "All areas", limit: 80, unit: "µg/m³", duration: "24-hour avg", source: "NAAQS 2009" },
  { id: "PL06", parameter: "NO₂", category: "air", context: "All areas", limit: 80, unit: "µg/m³", duration: "24-hour avg", source: "NAAQS 2009" },
  { id: "PL07", parameter: "CO", category: "air", context: "All areas", limit: 4, unit: "mg/m³", duration: "8-hour avg", source: "NAAQS 2009" },
  { id: "PL08", parameter: "O₃", category: "air", context: "All areas", limit: 180, unit: "µg/m³", duration: "8-hour avg", source: "NAAQS 2009" },
  { id: "PL09", parameter: "BOD", category: "water", context: "Class C — Drinking (conventional)", limit: 3, unit: "mg/L", duration: "Instant", source: "CPCB Standard" },
  { id: "PL10", parameter: "DO", category: "water", context: "Class C — Drinking (conventional)", limit: 4, unit: "mg/L", duration: "Minimum", source: "CPCB Standard" },
  { id: "PL11", parameter: "pH", category: "water", context: "All uses", limit: 8.5, unit: "", duration: "Max", source: "CPCB Standard" },
  { id: "PL12", parameter: "Leq", category: "noise", context: "Industrial zone — Day", limit: 75, unit: "dB(A)", duration: "Daytime (6-22h)", source: "CPCB Noise Rules 2000" },
  { id: "PL13", parameter: "Leq", category: "noise", context: "Industrial zone — Night", limit: 70, unit: "dB(A)", duration: "Nighttime (22-6h)", source: "CPCB Noise Rules 2000" },
  { id: "PL14", parameter: "Leq", category: "noise", context: "Commercial zone — Day", limit: 65, unit: "dB(A)", duration: "Daytime (6-22h)", source: "CPCB Noise Rules 2000" },
  { id: "PL15", parameter: "Leq", category: "noise", context: "Commercial zone — Night", limit: 55, unit: "dB(A)", duration: "Nighttime (22-6h)", source: "CPCB Noise Rules 2000" },
  { id: "PL16", parameter: "Leq", category: "noise", context: "Residential zone — Day", limit: 55, unit: "dB(A)", duration: "Daytime (6-22h)", source: "CPCB Noise Rules 2000" },
  { id: "PL17", parameter: "Leq", category: "noise", context: "Residential zone — Night", limit: 45, unit: "dB(A)", duration: "Nighttime (22-6h)", source: "CPCB Noise Rules 2000" },
  { id: "PL18", parameter: "Leq", category: "noise", context: "Silence zone — Day", limit: 50, unit: "dB(A)", duration: "Daytime (6-22h)", source: "CPCB Noise Rules 2000" },
  { id: "PL19", parameter: "Leq", category: "noise", context: "Silence zone — Night", limit: 40, unit: "dB(A)", duration: "Nighttime (22-6h)", source: "CPCB Noise Rules 2000" },
];

const catConfig = {
  air: { icon: Wind, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  water: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/15" },
  noise: { icon: Volume2, color: "text-purple-400", bg: "bg-purple-500/15" },
};

export default function LimitsPage() {
  const [tab, setTab] = useState<"units" | "limits">("limits");
  const { data: units } = useSupabaseCRUD<MonitoringUnit>("parameter_units", INITIAL_UNITS);
  const { data: limits } = useSupabaseCRUD<PrescribedLimit>("prescribed_limits", INITIAL_LIMITS);
  const [filterCat, setFilterCat] = useState<"all" | "air" | "water" | "noise">("all");

  const filteredUnits = units.filter((u) => filterCat === "all" || u.category === filterCat);
  const filteredLimits = limits.filter((l) => filterCat === "all" || l.category === filterCat);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Monitoring Units & Prescribed Limits</h1>
        <p className="text-sm text-muted">Configure environmental parameters and CPCB/NAAQS limits</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("limits")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "limits" ? "bg-primary text-white" : "bg-card text-muted hover:text-white"}`}>
          Prescribed Limits
        </button>
        <button onClick={() => setTab("units")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "units" ? "bg-primary text-white" : "bg-card text-muted hover:text-white"}`}>
          Monitoring Units
        </button>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex gap-2">
        {(["all", "air", "water", "noise"] as const).map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filterCat === c ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
            {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {tab === "limits" ? (
        /* Prescribed Limits Table */
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-muted">Parameter</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Context</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Limit</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Duration</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredLimits.map((lim) => {
                const cfg = catConfig[lim.category];
                const Icon = cfg.icon;
                return (
                  <tr key={lim.id} className="border-b border-border bg-background transition-colors hover:bg-card-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded p-1 ${cfg.bg}`}><Icon size={12} className={cfg.color} /></div>
                        <span className="font-medium text-white">{lim.parameter}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{lim.category}</span></td>
                    <td className="px-4 py-3 text-muted">{lim.context}</td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-white">{lim.limit}</span>
                      <span className="ml-1 text-xs text-muted">{lim.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{lim.duration}</td>
                    <td className="px-4 py-3 text-xs text-muted">{lim.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Monitoring Units Table */
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-muted">Parameter</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Symbol</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Unit</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => {
                const cfg = catConfig[u.category];
                const Icon = cfg.icon;
                return (
                  <tr key={u.id} className="border-b border-border bg-background transition-colors hover:bg-card-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded p-1 ${cfg.bg}`}><Icon size={12} className={cfg.color} /></div>
                        <span className="font-medium text-white">{u.parameter}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{u.symbol}</td>
                    <td className="px-4 py-3 text-muted">{u.unit || "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{u.category}</span></td>
                    <td className="px-4 py-3 text-xs text-muted">{u.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
