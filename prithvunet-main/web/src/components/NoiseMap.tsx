"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useNoise } from "./NoiseContext";
import type { NoiseStation } from "../lib/noiseTypes";

const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((module) => module.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((module) => module.Tooltip), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((module) => module.Popup), { ssr: false });

const ZONE_COLORS: Record<string, string> = {
  Industrial: "#f97316",
  Commercial: "#3b82f6",
  Residential: "#a855f7",
  Silence: "#06b6d4",
};

function markerColor(station: NoiseStation): string {
  return station.laf === null ? "#6b7280" : station.compliance.color;
}

function markerRadius(station: NoiseStation): number {
  if (station.laf === null) return 6;
  if (station.compliance.severity === "CRITICAL") return 12;
  if (station.compliance.severity === "HIGH") return 10;
  if (station.compliance.severity === "MODERATE") return 8;
  return 7;
}

function fillOpacity(station: NoiseStation): number {
  if (station.source === "live") return 0.95;
  if (station.source === "snapshot") return 0.85;
  return 0.74;
}

function severityLabel(station: NoiseStation): string {
  return station.compliance.severity === "OK" ? "Compliant" : station.compliance.severity;
}

export default function NoiseMap() {
  const { filteredStations, selectedStation, setSelectedStation } = useNoise();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0c1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={[21.5937, 78.9629]}
        zoom={4.8}
        style={{ height: "100%", width: "100%", background: "#060a10" }}
        zoomControl
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        />

        {filteredStations.map((station: NoiseStation) => {
          const isSelected = selectedStation?.station_id === station.station_id;
          const color = markerColor(station);

          return (
            <CircleMarker
              key={station.station_id}
              center={[station.lat, station.lng]}
              radius={isSelected ? markerRadius(station) + 2 : markerRadius(station)}
              pathOptions={{
                fillColor: color,
                fillOpacity: fillOpacity(station),
                color: isSelected ? "#ffffff" : color,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => setSelectedStation(isSelected ? null : station),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="min-w-[150px]">
                  <p className="font-semibold text-white">{station.name}</p>
                  <p className="text-xs text-zinc-400">{station.city} · {station.zone}</p>
                  <p className="mt-1 text-xs text-zinc-500">{station.source_label} source</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color }}>
                    {station.laf?.toFixed(1) ?? "—"} dB(A)
                  </p>
                  <p className="text-xs" style={{ color }}>
                    {severityLabel(station)}
                    {station.compliance.exceeded_by > 0 ? ` · +${station.compliance.exceeded_by} dB` : ""}
                  </p>
                </div>
              </Tooltip>

              {isSelected && (
                <Popup>
                  <div style={{ minWidth: 210, fontFamily: "inherit" }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{station.name}</p>
                    <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>
                      {station.city}, {station.state} · {station.zone}
                    </p>
                    <p style={{ fontSize: 12, marginBottom: 8 }}>Source: {station.source_label}</p>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                      <tbody>
                        {[
                          ["LAF", station.laf],
                          ["LAS", station.las],
                          ["LCF", station.lcf],
                          ["LPeak", station.lpeak],
                          ["Battery", station.battery ? `${station.battery.toFixed(2)}V` : null],
                        ].map(([label, value]) =>
                          value !== null && value !== undefined ? (
                            <tr key={String(label)}>
                              <td style={{ color: "#71717a", paddingRight: 8 }}>{label}</td>
                              <td style={{ fontWeight: 600 }}>
                                {typeof value === "number" ? `${value.toFixed(1)} dB` : value}
                              </td>
                            </tr>
                          ) : null,
                        )}
                      </tbody>
                    </table>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Compliance</p>
        {[
          { label: "Compliant", color: "#4ade80" },
          { label: "Moderate", color: "#f97316" },
          { label: "High", color: "#f97316" },
          { label: "Critical", color: "#ef4444" },
          { label: "No reading", color: "#6b7280" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 py-0.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-zinc-300">{label}</span>
          </div>
        ))}

        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Zone</p>
          {Object.entries(ZONE_COLORS).map(([zone, color]) => (
            <div key={zone} className="flex items-center gap-2 py-0.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-zinc-400">{zone}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-black/60 px-2 py-1 text-[10px] text-zinc-500">
        10 benchmark stations · CPCB fallback architecture
      </div>
    </div>
  );
}