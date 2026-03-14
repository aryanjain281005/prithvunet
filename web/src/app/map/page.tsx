"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { CalendarDays, Clock3, MapPin, RefreshCw, Wind } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
const INDIA_CENTER: [number, number] = [22.9734, 78.6569];

interface AirStation {
  stationId: string;
  stationName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  aqi: number;
  category: string;
  color: string;
  source: string;
  lastUpdated: string;
  pollutants: {
    pm25?: number | null;
    pm10?: number | null;
    no2?: number | null;
    so2?: number | null;
    co?: number | null;
    o3?: number | null;
  };
}

interface AirResponse {
  stations: AirStation[];
  filters: {
    states: string[];
    cities: string[];
    stations: string[];
  };
  meta: {
    count: number;
    updatedAt: string;
    waqiFallbackUsed: boolean;
    dateTimeRelaxed: boolean;
  };
}

interface ForecastPoint {
  timestamp: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
}

interface ForecastResponse {
  points: ForecastPoint[];
}

const AQI_LEGEND = [
  { label: "Good", color: "#22c55e" },
  { label: "Moderate", color: "#eab308" },
  { label: "Unhealthy (Sensitive)", color: "#f97316" },
  { label: "Unhealthy", color: "#ef4444" },
  { label: "Very unhealthy", color: "#a855f7" },
];

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatForecastLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
}

export default function MapPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const [stations, setStations] = useState<AirStation[]>([]);
  const [selectedReading, setSelectedReading] = useState<AirStation | null>(null);
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);

  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stationOptions, setStationOptions] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState(
    () => `${String(new Date().getHours()).padStart(2, "0")}:00`
  );
  const [forecastHours, setForecastHours] = useState<24 | 48 | 72>(72);
  const [lastSync, setLastSync] = useState("");
  const [meta, setMeta] = useState<AirResponse["meta"] | null>(null);

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

  const buildAirUrl = () => {
    const params = new URLSearchParams();
    if (selectedState) params.set("state", selectedState);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedStation) params.set("station", selectedStation);
    if (selectedDate) params.set("date", selectedDate);
    if (selectedTime) params.set("time", selectedTime);
    return `${API_BASE}/api/air-quality?${params.toString()}`;
  };

  const loadForecast = async (station: AirStation) => {
    setForecastLoading(true);
    try {
      const forecastUrl = `${API_BASE}/api/forecast?latitude=${station.lat}&longitude=${station.lng}&hours=${forecastHours}`;
      const response = await fetch(forecastUrl);
      if (!response.ok) {
        throw new Error("Unable to fetch forecast");
      }
      const payload: ForecastResponse = await response.json();
      setForecastPoints(payload.points || []);
    } catch {
      setForecastPoints([]);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadAirQuality = async (keepSelection: boolean) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildAirUrl());
      if (!response.ok) {
        throw new Error("FastAPI backend is not reachable");
      }

      const payload: AirResponse = await response.json();
      const nextStations = payload.stations || [];
      setStations(nextStations);
      setStateOptions(payload.filters?.states || []);
      setCityOptions(payload.filters?.cities || []);
      setStationOptions(payload.filters?.stations || []);
      setMeta(payload.meta || null);
      setLastSync(new Date().toLocaleTimeString("en-IN"));

      let activeStation: AirStation | null = null;
      if (keepSelection && selectedReading) {
        activeStation =
          nextStations.find((item) => item.stationId === selectedReading.stationId) || null;
      }
      if (!activeStation && selectedStation) {
        activeStation =
          nextStations.find((item) => item.stationName === selectedStation) || null;
      }
      if (!activeStation && nextStations.length > 0) {
        activeStation = nextStations[0];
      }

      setSelectedReading(activeStation);
      if (activeStation) {
        setSelectedStation(activeStation.stationName);
      } else {
        setForecastPoints([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load air quality data");
      setStations([]);
      setForecastPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    loadAirQuality(false);
    const interval = setInterval(() => {
      loadAirQuality(true);
    }, 300000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mapInstance || !selectedReading) {
      return;
    }

    mapInstance.flyTo([selectedReading.lat, selectedReading.lng], Math.max(mapInstance.getZoom(), 6), {
      duration: 0.45,
    });
  }, [mapInstance, selectedReading]);

  useEffect(() => {
    if (!selectedReading) {
      setForecastPoints([]);
      return;
    }

    void loadForecast(selectedReading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReading, forecastHours]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!selectedReading) return INDIA_CENTER;
    return [selectedReading.lat, selectedReading.lng];
  }, [selectedReading]);

  const forecastChartData = useMemo(() => {
    return {
      labels: forecastPoints.map((p) => formatForecastLabel(p.timestamp)),
      datasets: [
        {
          label: "PM2.5",
          data: forecastPoints.map((p) => p.pm25),
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.15)",
          tension: 0.35,
        },
        {
          label: "PM10",
          data: forecastPoints.map((p) => p.pm10),
          borderColor: "#eab308",
          backgroundColor: "rgba(234,179,8,0.15)",
          tension: 0.35,
        },
        {
          label: "CO",
          data: forecastPoints.map((p) => p.co),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.12)",
          tension: 0.35,
        },
        {
          label: "NO2",
          data: forecastPoints.map((p) => p.no2),
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96,165,250,0.12)",
          tension: 0.35,
        },
      ],
    };
  }, [forecastPoints]);

  const forecastChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        ticks: { color: "#a1a1aa", maxTicksLimit: 12 },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "#a1a1aa" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#d4d4d8",
        },
      },
      tooltip: {
        backgroundColor: "rgba(20,20,23,0.95)",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
      },
    },
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#06080d]">
      <header className="border-b border-white/10 bg-[#0a0a0f] px-4 py-3 lg:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">PrithviNet</h1>
            <p className="text-xs text-zinc-500">
              Real-time Air Monitoring Dashboard {lastSync ? `- Updated ${lastSync}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300">
              Stations Active {stations.length}
            </div>
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-500/25"
            >
              <span>🏭</span>
              Open Industry Module
            </Link>
            <button
              onClick={() => loadAirQuality(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCity("");
              setSelectedStation("");
            }}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
          >
            <option value="">All States</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedStation("");
            }}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
          >
            <option value="">All Cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none lg:col-span-2"
          >
            <option value="">All Stations</option>
            {stationOptions.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            <CalendarDays size={14} className="text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent text-zinc-200 outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            <Clock3 size={14} className="text-zinc-500" />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-transparent text-zinc-200 outline-none"
            />
          </label>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => loadAirQuality(false)}
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/30"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setSelectedState("");
              setSelectedCity("");
              setSelectedStation("");
              setSelectedDate(now.toISOString().slice(0, 10));
              setSelectedTime(`${String(now.getHours()).padStart(2, "0")}:00`);
            }}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/15"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:min-h-[620px] lg:grid-cols-[1fr_360px]">
        <section className="relative min-h-[460px] border-b border-white/10 lg:min-h-[620px] lg:border-b-0 lg:border-r lg:border-r-white/10">
          {loading && stations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400">Loading station data...</p>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={selectedReading ? 7 : 5}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              ref={(instance) => {
                if (instance && instance !== mapInstance) {
                  setMapInstance(instance);
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {stations.map((station) => (
                <CircleMarker
                  key={station.stationId}
                  center={[station.lat, station.lng]}
                  radius={
                    station.aqi > 200
                      ? 10
                      : station.aqi > 150
                        ? 9
                        : station.aqi > 100
                          ? 8
                          : station.aqi > 50
                            ? 7
                            : 6
                  }
                  pathOptions={{
                    fillColor: station.color,
                    color: station.color,
                    fillOpacity: 0.8,
                    weight: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedReading(station);
                      setSelectedStation(station.stationName);
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-[230px] text-xs">
                      <p className="text-sm font-semibold">{station.stationName}</p>
                      <p className="text-zinc-600">{station.city}, {station.state}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: station.color }}
                        >
                          AQI {station.aqi}
                        </span>
                        <span className="text-[11px]">{station.category}</span>
                      </div>
                      <p className="mt-2">PM2.5: {station.pollutants.pm25 ?? "--"}</p>
                      <p>PM10: {station.pollutants.pm10 ?? "--"}</p>
                      <p className="mt-1 text-zinc-600">Updated: {formatDateTime(station.lastUpdated)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}

          <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold text-zinc-200">AQI Legend</p>
            <div className="space-y-1.5">
              {AQI_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="overflow-y-auto bg-[#0a0a0f] p-4 lg:max-h-[620px]">
          <h2 className="mb-1 text-sm font-semibold text-white">Pollution Details</h2>
          <p className="mb-4 text-xs text-zinc-500">
            {stations.length} monitoring stations loaded
          </p>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {meta?.waqiFallbackUsed && (
            <div className="mb-3 rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-xs text-orange-300">
              CPCB city data not found for this filter. WAQI fallback is being shown.
            </div>
          )}

          {meta?.dateTimeRelaxed && (
            <div className="mb-3 rounded-lg border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-300">
              Exact date/time match not available. Showing latest available records.
            </div>
          )}

          {selectedReading ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{selectedReading.stationName}</p>
                    <p className="text-xs text-zinc-500">
                      {selectedReading.city}, {selectedReading.state}
                    </p>
                  </div>
                  <span
                    className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: selectedReading.color }}
                  >
                    AQI {selectedReading.aqi}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{selectedReading.category}</p>
                <p className="mt-1 text-xs text-zinc-500">Source: {selectedReading.source}</p>
                <p className="text-xs text-zinc-500">Updated: {formatDateTime(selectedReading.lastUpdated)}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-xs font-semibold text-zinc-300">Pollutants</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-black/30 p-2">PM2.5: {selectedReading.pollutants.pm25 ?? "--"}</div>
                  <div className="rounded-lg bg-black/30 p-2">PM10: {selectedReading.pollutants.pm10 ?? "--"}</div>
                  <div className="rounded-lg bg-black/30 p-2">NO2: {selectedReading.pollutants.no2 ?? "--"}</div>
                  <div className="rounded-lg bg-black/30 p-2">SO2: {selectedReading.pollutants.so2 ?? "--"}</div>
                  <div className="rounded-lg bg-black/30 p-2">CO: {selectedReading.pollutants.co ?? "--"}</div>
                  <div className="rounded-lg bg-black/30 p-2">O3: {selectedReading.pollutants.o3 ?? "--"}</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-xs font-semibold text-zinc-300">Station Quick List</p>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {stations.slice(0, 25).map((station) => (
                    <button
                      key={station.stationId}
                      onClick={() => {
                        setSelectedReading(station);
                        setSelectedStation(station.stationName);
                      }}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        selectedReading.stationId === station.stationId
                          ? "bg-white/10 text-zinc-100"
                          : "text-zinc-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{station.stationName}</span>
                        <span style={{ color: station.color }}>AQI {station.aqi}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-500">
              Select a station marker to view detailed pollution metrics.
            </div>
          )}
        </aside>
      </div>

      <section className="border-t border-white/10 bg-[#09090b] px-4 py-3 lg:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Air Pollution Forecast (Open-Meteo)</h3>
            <p className="text-xs text-zinc-500">
              {selectedReading ? `${selectedReading.stationName} - next ${forecastHours} hours` : "Select a station"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-zinc-500" />
            <Wind size={14} className="text-zinc-500" />
            <select
              value={forecastHours}
              onChange={(e) => setForecastHours(Number(e.target.value) as 24 | 48 | 72)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300"
            >
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </div>
        </div>

        <div className="h-64 rounded-xl border border-white/10 bg-black/25 p-2">
          {forecastLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Loading forecast...
            </div>
          ) : forecastPoints.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No forecast points available for this station.
            </div>
          ) : (
            <Line data={forecastChartData} options={forecastChartOptions} />
          )}
        </div>
      </section>
    </div>
  );
}