"use client";

import dynamic from "next/dynamic";
import type { Map as LeafletMap } from "leaflet";
import { ListFilter, Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useIndustry } from "@/components/IndustryContext";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false }
);

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];

const COMPLIANCE_LEGEND = [
  { label: "Compliant", color: "#22c55e" },
  { label: "Violation", color: "#ef4444" },
  { label: "Unknown", color: "#f59e0b" },
];

const STATUS_FILTERS: Array<{ value: "" | "Violation" | "Compliant" | "Unknown"; label: string }> = [
  { value: "", label: "All" },
  { value: "Violation", label: "Violation" },
  { value: "Compliant", label: "Compliant" },
  { value: "Unknown", label: "Unknown" },
];

const MAP_DENSITY_OPTIONS = [
  { value: 300, label: "300" },
  { value: 700, label: "700" },
  { value: 1500, label: "1,500" },
  { value: 5000, label: "5,000" },
  { value: 10000, label: "All" },
];

function formatDateTime(timestamp: string) {
  if (!timestamp) {
    return "Not available";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IndustryMap() {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const {
    ensureMapMarkers,
    filters,
    loadingMarkers,
    mapLimit,
    mapLimitApplied,
    mapMarkers,
    mapReturned,
    mapTotalMatched,
    selectedIndustryId,
    selectedIndustrySummary,
    setMapLimit,
    selectIndustry,
    updateFilters,
  } = useIndustry();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    ensureMapMarkers();
  }, [ensureMapMarkers, mounted]);

  useEffect(() => {
    if (!mapInstance || !selectedIndustrySummary) {
      return;
    }
    const currentZoom = mapInstance.getZoom();
    mapInstance.flyTo(
      [selectedIndustrySummary.lat, selectedIndustrySummary.lng],
      Math.max(currentZoom, 6),
      { duration: 0.6 }
    );
  }, [mapInstance, selectedIndustrySummary]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!selectedIndustrySummary) {
      return INDIA_CENTER;
    }
    return [selectedIndustrySummary.lat, selectedIndustrySummary.lng];
  }, [selectedIndustrySummary]);

  if (!mounted) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-black/35 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div>
          <p className="text-sm font-semibold text-white">Industry Monitoring Map</p>
          <p className="mt-1 text-xs text-zinc-400">
            Showing {mapReturned.toLocaleString("en-IN")} of {mapTotalMatched.toLocaleString("en-IN")} markers
            {mapLimitApplied < mapTotalMatched ? ` (limit ${mapLimitApplied.toLocaleString("en-IN")})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
            {STATUS_FILTERS.map((option) => (
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

          <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
            <ListFilter size={13} className="text-zinc-400" />
            Density
            <select
              value={mapLimit}
              onChange={(event) => setMapLimit(Number(event.target.value))}
              className="bg-transparent text-xs text-zinc-100 outline-none"
            >
              {MAP_DENSITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-zinc-900">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="relative min-h-[470px]">
        {loadingMarkers && mapMarkers.length === 0 ? (
          <div className="flex h-full min-h-[470px] items-center justify-center text-sm text-zinc-400">
            <Loader2 size={16} className="mr-2 animate-spin" /> Loading industry markers...
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={selectedIndustrySummary ? 6 : 5}
            style={{ height: "470px", width: "100%" }}
            zoomControl={true}
            whenReady={(event: { target: LeafletMap }) => setMapInstance(event.target)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {mapMarkers.map((marker) => (
              <CircleMarker
                key={marker.id}
                center={[marker.lat, marker.lng]}
                radius={selectedIndustryId === marker.id ? 10 : 7}
                pathOptions={{
                  fillColor: marker.color,
                  color: selectedIndustryId === marker.id ? "#ffffff" : marker.color,
                  fillOpacity: 0.82,
                  weight: selectedIndustryId === marker.id ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => {
                    void selectIndustry(marker.id);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[220px] text-xs">
                    <p className="text-sm font-semibold">{marker.name}</p>
                    <p className="text-zinc-600">
                      {marker.city}, {marker.state}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: marker.color }}
                      >
                        {marker.status}
                      </span>
                      <span className="text-[11px]">{marker.category || "Unknown category"}</span>
                    </div>
                    <p className="mt-2">Updated: {formatDateTime(marker.lastDataTime)}</p>
                    <p className="mt-1 text-zinc-600">Location: {marker.locationSource}</p>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-medium text-white"
                      onClick={() => {
                        void selectIndustry(marker.id);
                      }}
                    >
                      View Industry Details
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        <div className="absolute bottom-4 left-4 z-[900] rounded-2xl border border-white/10 bg-black/70 px-3 py-2.5 text-xs text-zinc-300 backdrop-blur-md">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-100">
            <MapPin size={12} /> Marker Legend
          </div>
          <div className="space-y-1.5">
            {COMPLIANCE_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-[900] max-w-[360px] rounded-2xl border border-amber-300/20 bg-amber-200/10 px-3 py-2 text-[11px] text-amber-100 backdrop-blur-sm">
          <span className="font-semibold">Note:</span> All industry names, categories, states, cities, addresses and compliance readings are real CPCB RTDMS data. Map positions are geocoded city centres (OpenStreetMap) — the RTDMS API does not publish GPS coordinates.
        </div>
      </div>
    </section>
  );
}