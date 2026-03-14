"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Droplets, MapPin, RefreshCw, Search, Waves } from "lucide-react";
import type { WaterApiResponse, WaterReading, WaterStatus } from "@/lib/types";
import { getWaterStatusColor } from "@/lib/water";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false },
);

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const STATUS_OPTIONS: WaterStatus[] = ["Safe", "Caution", "Polluted", "Critical"];
const STATUS_BG: Record<WaterStatus, string> = {
  Safe: "bg-emerald-500/15 text-emerald-400",
  Caution: "bg-yellow-500/15 text-yellow-400",
  Polluted: "bg-orange-500/15 text-orange-400",
  Critical: "bg-red-500/15 text-red-400",
};

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMetric(value?: number, digits: number = 2): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function getMarkerRadius(station: WaterReading): number {
  const base = {
    Safe: 8,
    Caution: 10,
    Polluted: 12,
    Critical: 14,
  }[station.status];

  const bod = station.parameters.bod ?? 0;
  return Math.min(base + Math.round(bod / 5), 18);
}

export default function WaterPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stations, setStations] = useState<WaterReading[]>([]);
  const [selectedReading, setSelectedReading] = useState<WaterReading | null>(null);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState("");

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | WaterStatus>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const existing = document.querySelector('link[data-leaflet="true"]');
    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.dataset.leaflet = "true";
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [mounted]);

  const buildWaterUrl = () => {
    const params = new URLSearchParams({ format: "stations" });
    if (selectedState) params.set("state", selectedState);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedStatus) params.set("status", selectedStatus);
    if (search.trim()) params.set("search", search.trim());
    return `/api/water?${params.toString()}`;
  };

  const loadWaterData = async (keepSelection: boolean) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildWaterUrl(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to fetch water quality data");
      }

      const payload = (await response.json()) as WaterApiResponse;
      const nextStations = payload.stations || [];

      setStations(nextStations);
      setStateOptions(payload.filters?.states || []);
      setCityOptions(payload.filters?.cities || []);
      setLastSync(new Date().toLocaleTimeString("en-IN"));

      let activeStation: WaterReading | null = null;
      if (keepSelection && selectedReading) {
        activeStation = nextStations.find((item) => item.stationId === selectedReading.stationId) || null;
      }
      if (!activeStation && nextStations.length > 0) {
        activeStation = nextStations[0];
      }

      setSelectedReading(activeStation);
    } catch (loadError) {
      setStations([]);
      setSelectedReading(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to fetch water quality data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    loadWaterData(false);
    const interval = window.setInterval(() => {
      loadWaterData(true);
    }, 300000);

    return () => window.clearInterval(interval);
  }, [mounted]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!selectedReading) {
      return INDIA_CENTER;
    }

    return [selectedReading.lat, selectedReading.lng];
  }, [selectedReading]);

  const summary = useMemo(() => {
    const critical = stations.filter((item) => item.status === "Critical").length;
    const polluted = stations.filter((item) => item.status === "Polluted").length;
    const avgBod = stations.reduce((sum, item) => sum + (item.parameters.bod ?? 0), 0) / Math.max(stations.length, 1);
    const lowDo = stations.filter((item) => (item.parameters.dissolvedOxygen ?? 99) < 4).length;

    return {
      critical,
      polluted,
      avgBod,
      lowDo,
    };
  }, [stations]);

  const highlightedStations = useMemo(() => {
    return [...stations]
      .sort((left, right) => {
        const statusRank = STATUS_OPTIONS.indexOf(right.status) - STATUS_OPTIONS.indexOf(left.status);
        if (statusRank !== 0) return statusRank;
        return (right.parameters.bod ?? 0) - (left.parameters.bod ?? 0);
      })
      .slice(0, 6);
  }, [stations]);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-zinc-500">Real-time river and inland water monitoring</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-white">Water Pollution Monitor</h1>
          <p className="mt-1 text-sm text-zinc-500">
            CPCB RTWQMS stations formatted into live station-level markers using the latest timestamp per station.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
            Stations Active {stations.length}
          </div>
          <button
            onClick={() => loadWaterData(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Live Stations</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stations.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Updated {lastSync || "just now"}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Critical Stretches</p>
          <p className="mt-3 text-3xl font-semibold text-red-400">{summary.critical}</p>
          <p className="mt-1 text-sm text-zinc-500">Immediate action required</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Average BOD</p>
          <p className="mt-3 text-3xl font-semibold text-cyan-300">{formatMetric(summary.avgBod, 1)}</p>
          <p className="mt-1 text-sm text-zinc-500">mg/L across filtered stations</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Low DO Stations</p>
          <p className="mt-3 text-3xl font-semibold text-orange-300">{summary.lowDo}</p>
          <p className="mt-1 text-sm text-zinc-500">Dissolved oxygen below 4 mg/L</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/5 bg-[#0b0e14] p-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          value={selectedState}
          onChange={(event) => setSelectedState(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 outline-none"
        >
          <option value="">All States</option>
          {stateOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={selectedCity}
          onChange={(event) => setSelectedCity(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 outline-none"
        >
          <option value="">All Cities</option>
          {cityOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
          <Search size={15} className="text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search station or river"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as "" | WaterStatus)}
            className="min-w-[140px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 outline-none"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            onClick={() => loadWaterData(false)}
            className="rounded-xl bg-cyan-500/15 px-4 py-3 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSelectedState("");
              setSelectedCity("");
              setSelectedStatus("");
              setSearch("");
              window.setTimeout(() => {
                loadWaterData(false);
              }, 0);
            }}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04]"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-[28px] border border-white/5 bg-[#080b11]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-white">National Water Quality Map</p>
              <p className="text-xs text-zinc-500">Circle size reflects BOD load, color reflects CPCB-style station status</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Safe</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Caution</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> Polluted</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Critical</span>
            </div>
          </div>

          <div className="h-[620px]">
            {mounted ? (
              <MapContainer center={mapCenter} zoom={5} scrollWheelZoom className="h-full w-full bg-[#05070a]">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {stations.map((station) => {
                  const color = getWaterStatusColor(station.status);
                  return (
                    <CircleMarker
                      key={station.stationId}
                      center={[station.lat, station.lng]}
                      radius={getMarkerRadius(station)}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 2 }}
                      eventHandlers={{ click: () => setSelectedReading(station) }}
                    >
                      <Popup>
                        <div className="min-w-[220px] text-sm text-slate-900">
                          <div className="font-semibold">{station.stationName}</div>
                          <div>{station.city}, {station.state}</div>
                          <div className="mt-2">Status: {station.status}</div>
                          <div>BOD: {formatMetric(station.parameters.bod)} mg/L</div>
                          <div>DO: {formatMetric(station.parameters.dissolvedOxygen)} mg/L</div>
                          <div>pH: {formatMetric(station.parameters.ph)}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/5 bg-[#080b11] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Water Pollution Details</p>
                <p className="mt-1 text-xs text-zinc-500">Click any marker to inspect the latest station snapshot</p>
              </div>
              {selectedReading && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BG[selectedReading.status]}`}>
                  {selectedReading.status}
                </span>
              )}
            </div>

            {!selectedReading ? (
              <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
                Select a station on the map to inspect water quality parameters.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedReading.stationName}</h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin size={14} /> {selectedReading.city}, {selectedReading.state}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                    <Waves size={14} /> {selectedReading.riverName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">BOD</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(selectedReading.parameters.bod, 1)}</p>
                    <p className="text-xs text-zinc-500">mg/L</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">DO</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(selectedReading.parameters.dissolvedOxygen, 1)}</p>
                    <p className="text-xs text-zinc-500">mg/L</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">pH</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(selectedReading.parameters.ph, 2)}</p>
                    <p className="text-xs text-zinc-500">acidity/alkalinity</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">Conductivity</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(selectedReading.parameters.conductivity, 0)}</p>
                    <p className="text-xs text-zinc-500">uS/cm</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-zinc-300">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Droplets size={15} className="text-cyan-300" /> Latest sample recorded {formatDateTime(selectedReading.timestamp)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                    <div>COD: <span className="text-zinc-200">{formatMetric(selectedReading.parameters.cod, 1)}</span> mg/L</div>
                    <div>Temperature: <span className="text-zinc-200">{formatMetric(selectedReading.parameters.temperature, 1)}</span> °C</div>
                    <div>Turbidity: <span className="text-zinc-200">{formatMetric(selectedReading.parameters.turbidity, 1)}</span></div>
                    <div>Nitrate: <span className="text-zinc-200">{formatMetric(selectedReading.parameters.nitrate, 1)}</span> mg/L</div>
                  </div>
                </div>

                {(selectedReading.status === "Critical" || selectedReading.status === "Polluted") && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-200">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle size={15} /> Elevated pollution indicators detected for this station.
                    </div>
                    <p className="mt-2 text-xs text-red-200/80">
                      Prioritize verification of dissolved oxygen, BOD, and COD trends before escalating compliance action.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/5 bg-[#080b11] p-5">
            <p className="text-sm font-semibold text-white">High Attention Stations</p>
            <div className="mt-4 space-y-3">
              {highlightedStations.map((station) => (
                <button
                  key={station.stationId}
                  onClick={() => setSelectedReading(station)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{station.stationName}</p>
                    <p className="text-xs text-zinc-500">{station.city}, {station.state}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_BG[station.status]}`}>
                      {station.status}
                    </span>
                    <p className="mt-1 text-xs text-zinc-500">BOD {formatMetric(station.parameters.bod, 1)} mg/L</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-white/10 bg-[#080b11] px-5 py-4 text-sm text-zinc-300">
            Loading water stations...
          </div>
        </div>
      )}
    </div>
  );
}