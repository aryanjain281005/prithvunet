"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Droplets, LogIn, Search, Volume2, Wind, X } from "lucide-react";
import { fetchMergedAirData, generateNoiseData, generateWaterData, getAQIColor, getAQICategory } from "@/lib/api";
import type { AQIReading, NoiseReading, WaterReading } from "@/lib/types";

function statusClass(status: WaterReading["status"]): string {
  if (status === "Safe") return "text-emerald-300 bg-emerald-500/15";
  if (status === "Caution") return "text-yellow-300 bg-yellow-500/15";
  if (status === "Polluted") return "text-orange-300 bg-orange-500/15";
  return "text-red-300 bg-red-500/15";
}

function getAqiInfo(aqi: number): { label: string; advice: string; range: string } {
  if (aqi <= 50) {
    return {
      label: "Good",
      advice: "Air is safe for outdoor activity.",
      range: "0-50",
    };
  }
  if (aqi <= 100) {
    return {
      label: "Moderate",
      advice: "Unusually sensitive people should reduce long outdoor exertion.",
      range: "51-100",
    };
  }
  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      advice: "Children, elderly, and asthma patients should limit outdoor effort.",
      range: "101-150",
    };
  }
  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      advice: "Everyone should reduce outdoor activity and use masks if needed.",
      range: "151-200",
    };
  }
  if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      advice: "Avoid prolonged outdoor exposure; keep vulnerable groups indoors.",
      range: "201-300",
    };
  }
  return {
    label: "Hazardous",
    advice: "Health alert: avoid outdoor activity and follow emergency advisories.",
    range: "301+",
  };
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [airData, setAirData] = useState<AQIReading[]>([]);
  const [waterData, setWaterData] = useState<WaterReading[]>([]);
  const [noiseData, setNoiseData] = useState<NoiseReading[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAir, setSelectedAir] = useState<AQIReading | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const [air, water] = await Promise.all([fetchMergedAirData(), generateWaterData()]);
      setAirData(air);
      setWaterData(water);
      setNoiseData(generateNoiseData());
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-select worst city on first load
  useEffect(() => {
    if (airData.length === 0 || selectedAir) return;
    const worst = [...airData].sort((a, b) => b.aqi - a.aqi)[0];
    setSelectedAir(worst ?? null);
  }, [airData, selectedAir]);

  const averageAqi = useMemo(() => {
    if (airData.length === 0) return 0;
    return Math.round(airData.reduce((s, i) => s + i.aqi, 0) / airData.length);
  }, [airData]);

  const topAir = useMemo(
    () => [...airData].sort((a, b) => b.aqi - a.aqi).slice(0, 8),
    [airData],
  );

  const filteredSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = [...airData].sort((a, b) => b.aqi - a.aqi);
    if (!query) return source.slice(0, 14);
    return source
      .filter(
        (item) =>
          item.city.toLowerCase().includes(query) ||
          item.stationName.toLowerCase().includes(query) ||
          item.state.toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [airData, searchQuery]);

  const activeAqi = selectedAir?.aqi ?? averageAqi;
  const activeInfo = getAqiInfo(activeAqi);

  const waterHotspots = useMemo(
    () => waterData.filter((i) => i.status === "Critical" || i.status === "Polluted").slice(0, 6),
    [waterData],
  );

  const noisy = useMemo(
    () => noiseData.filter((i) => i.exceedance).slice(0, 6),
    [noiseData],
  );

  function selectStation(item: AQIReading) {
    setSelectedAir(item);
    setSearchQuery(item.city);
    setSearchOpen(false);
  }

  const totalStations = airData.length;

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100">
      <header className="border-b border-white/10 bg-[#050f1f]/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PrithviNet Live</h1>
            <p className="text-xs text-zinc-400">Citizen Environmental Portal • Last update {lastUpdated || "--"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/map"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
            >
              Open Pollution Map
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/85 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <LogIn size={14} /> Official Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0b1222] via-[#0b1f2f] to-[#132a45] p-6 shadow-[0_20px_80px_-30px_rgba(14,165,233,0.35)] lg:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Realtime Citizen Snapshot</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                India-wide Air, Water, and Noise Preview
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300">
                Built on CPCB and integrated project data. Citizens get transparent live visibility, and officials can log in for compliance workflows and operations.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/citizen" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15">
                  Go to Full Citizen Portal <ArrowRight size={14} />
                </Link>
                <Link href="/water" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/10">
                  Open Water Monitor
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-400">National Avg AQI</p>
              <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-full border-4" style={{ borderColor: getAQIColor(averageAqi), backgroundColor: `${getAQIColor(averageAqi)}1e` }}>
                <span className="text-5xl font-semibold" style={{ color: getAQIColor(averageAqi) }}>{averageAqi}</span>
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: getAQIColor(averageAqi) }}>{getAQICategory(averageAqi)}</p>
              <p className="mt-1 text-sm text-zinc-300">{totalStations} monitoring stations in preview</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
              Loading live environmental preview...
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-cyan-400/20 bg-[#071323] p-5 lg:col-span-3">
              {/* Search header */}
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Real-time Air Quality Index (AQI)</p>
                <h3 className="mt-1.5 text-xl font-semibold text-white">Search any city or monitoring station</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {totalStations} stations loaded across India — type to instantly filter.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                {/* Left — search + results */}
                <div>
                  <div ref={searchRef} className="relative">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1a2e] px-4 py-3 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20">
                      <Search size={15} className="shrink-0 text-zinc-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search e.g. Delhi, Bengaluru, Patna, Tier-2 city..."
                        className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(""); setSearchOpen(true); }}
                          className="shrink-0 text-zinc-500 hover:text-zinc-300"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {searchOpen && filteredSearchResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a1928] shadow-2xl">
                        <div className="border-b border-white/5 px-3 py-1.5">
                          <span className="text-[11px] text-zinc-500">
                            {filteredSearchResults.length} result{filteredSearchResults.length !== 1 ? "s" : ""}
                            {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : " — showing by highest AQI"}
                          </span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {filteredSearchResults.map((item) => (
                            <button
                              key={item.stationId}
                              onClick={() => selectStation(item)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-zinc-100">{item.city}</p>
                                <p className="truncate text-xs text-zinc-500">{item.stationName} • {item.state}</p>
                              </div>
                              <span
                                className="shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-bold"
                                style={{ color: getAQIColor(item.aqi), backgroundColor: `${getAQIColor(item.aqi)}22` }}
                              >
                                {item.aqi}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick badge grid below search */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Patna", "Kanpur"].map((city) => {
                      const match = airData.find((d) => d.city === city);
                      if (!match) return null;
                      return (
                        <button
                          key={city}
                          onClick={() => selectStation(match)}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 transition hover:bg-white/[0.08]"
                        >
                          {city}
                          <span
                            className="ml-1.5 font-semibold"
                            style={{ color: getAQIColor(match.aqi) }}
                          >
                            {match.aqi}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right — health impact card */}
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-400">Health Impact</p>
                  <p className="mt-1.5 text-sm text-zinc-300 truncate">
                    {selectedAir ? `${selectedAir.city} — ${selectedAir.stationName}` : "India average"}
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2"
                      style={{ borderColor: getAQIColor(activeAqi), backgroundColor: `${getAQIColor(activeAqi)}1e` }}
                    >
                      <span className="text-3xl font-bold" style={{ color: getAQIColor(activeAqi) }}>{activeAqi}</span>
                    </div>
                    <div>
                      <p className="text-base font-semibold leading-snug" style={{ color: getAQIColor(activeAqi) }}>
                        {activeInfo.label}
                      </p>
                      <p className="text-xs text-zinc-400">Range: {activeInfo.range}</p>
                      {selectedAir?.dominantPollutant && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Dominant: <span className="text-zinc-200 font-medium uppercase">{selectedAir.dominantPollutant}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 leading-relaxed">
                    {activeInfo.advice}
                  </p>

                  {/* AQI scale legend */}
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span><span className="text-emerald-400">0–50</span> — Good</span>
                    <span><span className="text-yellow-300">51–100</span> — Moderate</span>
                    <span><span className="text-orange-300">101–150</span> — Sensitive groups</span>
                    <span><span className="text-red-400">151–200</span> — Unhealthy</span>
                    <span><span className="text-purple-400">201–300</span> — Very Unhealthy</span>
                    <span><span className="text-rose-600">301+</span> — Hazardous</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#071323] p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Wind size={15} className="text-cyan-300" /> Top AQI Cities</h3>
                <span className="text-xs text-zinc-400">Live preview</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {topAir.map((item) => (
                  <div key={item.stationId} className="rounded-xl bg-white/[0.04] p-3">
                    <p className="truncate text-sm font-medium text-zinc-200">{item.city}</p>
                    <p className="truncate text-xs text-zinc-500">{item.stationName}</p>
                    <div className="mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ color: getAQIColor(item.aqi), backgroundColor: `${getAQIColor(item.aqi)}20` }}>
                      AQI {item.aqi} • {item.category}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#071323] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Droplets size={15} className="text-blue-300" /> Water Hotspots</h3>
              <div className="space-y-2.5">
                {waterHotspots.length === 0 ? (
                  <p className="text-xs text-zinc-400">No polluted/critical stations in the current preview.</p>
                ) : (
                  waterHotspots.map((item) => (
                    <div key={item.stationId} className="rounded-xl bg-white/[0.04] p-3">
                      <p className="truncate text-sm text-zinc-200">{item.riverName}</p>
                      <p className="truncate text-xs text-zinc-500">{item.stationName}</p>
                      <span className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#071323] p-5 lg:col-span-3">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Volume2 size={15} className="text-purple-300" /> Noise Exceedance Preview</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {noisy.length === 0 ? (
                  <p className="text-xs text-zinc-400">No exceedance stations in current noise preview.</p>
                ) : (
                  noisy.map((item) => (
                    <div key={item.stationId} className="rounded-xl bg-white/[0.04] p-3">
                      <p className="truncate text-sm text-zinc-200">{item.stationName}</p>
                      <p className="text-xs text-zinc-500">{item.city} • {item.zone}</p>
                      <p className="mt-2 text-sm font-semibold text-red-300">{item.leq} dB (limit {item.limit})</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
