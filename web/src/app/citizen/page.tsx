"use client";

import { useEffect, useState } from "react";
import { Wind, Droplets, Volume2, MapPin, AlertTriangle, ExternalLink, Info, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { fetchMergedAirData, generateWaterData, generateNoiseData, getAQICategory, getAQIColor, getAQIEmoji } from "@/lib/api";
import type { AQIReading, WaterReading, NoiseReading } from "@/lib/types";
import Link from "next/link";

function HealthAdvisory({ aqi }: { aqi: number }) {
  if (aqi <= 50) return <p className="text-sm text-green-400">✅ Air quality is good. Enjoy outdoor activities!</p>;
  if (aqi <= 100) return <p className="text-sm text-green-300">👍 Air quality is satisfactory. Sensitive groups should limit prolonged outdoor exertion.</p>;
  if (aqi <= 200) return <p className="text-sm text-yellow-400">⚠️ Air quality is moderate. Reduce prolonged outdoor exertion. Children and elderly should be cautious.</p>;
  if (aqi <= 300) return <p className="text-sm text-orange-400">🚨 Air quality is poor. Everyone should reduce outdoor activities. Wear N95 masks outdoors.</p>;
  if (aqi <= 400) return <p className="text-sm text-red-400">🔴 Very poor air quality! Avoid all outdoor physical activities. Keep windows closed.</p>;
  return <p className="text-sm text-red-500">☠️ SEVERE! Health emergency. Stay indoors. Use air purifiers. Seek medical attention if feeling unwell.</p>;
}

export default function CitizenPage() {
  const [airData, setAirData] = useState<AQIReading[]>([]);
  const [waterData, setWaterData] = useState<WaterReading[]>([]);
  const [noiseData, setNoiseData] = useState<NoiseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"air" | "water" | "noise">("air");

  useEffect(() => {
    async function load() {
      const [air, water] = await Promise.all([fetchMergedAirData(), generateWaterData()]);
      setAirData(air);
      setWaterData(water);
      setNoiseData(generateNoiseData());
      setLoading(false);
    }
    load();
  }, []);

  const avgAQI = airData.length > 0 ? Math.round(airData.reduce((s, r) => s + r.aqi, 0) / airData.length) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-lg font-bold text-white">
              🌍
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">PrithviNet</h1>
              <p className="text-[11px] text-muted">Smart Environmental Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              Live Data
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Hero AQI Card */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex flex-col items-center">
              <div
                className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4"
                style={{ borderColor: getAQIColor(avgAQI), backgroundColor: `${getAQIColor(avgAQI)}15` }}
              >
                <span className="text-3xl">{getAQIEmoji(avgAQI)}</span>
                <span className="text-2xl font-bold text-white">{avgAQI}</span>
              </div>
              <p className="mt-2 text-xs text-muted">National Average AQI</p>
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-xl font-bold text-white">
                Air Quality: <span style={{ color: getAQIColor(avgAQI) }}>{getAQICategory(avgAQI)}</span>
              </h2>
              <HealthAdvisory aqi={avgAQI} />
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                <span>📊 Monitoring {airData.length} stations</span>
                <span>💧 {waterData.length} water stations</span>
                <span>🔊 {noiseData.length} noise stations</span>
                <span>🕐 Updated: {new Date().toLocaleTimeString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex gap-1 rounded-xl bg-card p-1">
          {[
            { id: "air" as const, label: "Air Quality", icon: <Wind size={14} /> },
            { id: "water" as const, label: "Water Quality", icon: <Droplets size={14} /> },
            { id: "noise" as const, label: "Noise Levels", icon: <Volume2 size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-primary text-white" : "text-muted hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Air Quality Tab */}
        {activeTab === "air" && (
          <div className="space-y-3">
            {airData.map((r) => (
              <div key={r.stationId} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedCity(expandedCity === r.stationId ? null : r.stationId)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: getAQIColor(r.aqi) }}
                    >
                      {r.aqi}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.city}</p>
                      <p className="text-xs text-muted">{r.stationName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: getAQIColor(r.aqi) }}>
                      {getAQICategory(r.aqi)}
                    </span>
                    {expandedCity === r.stationId ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                  </div>
                </button>
                {expandedCity === r.stationId && (
                  <div className="border-t border-border px-4 py-3">
                    <HealthAdvisory aqi={r.aqi} />
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "PM₂.₅", value: r.pollutants.pm25, unit: "µg/m³", limit: 60 },
                        { label: "PM₁₀", value: r.pollutants.pm10, unit: "µg/m³", limit: 100 },
                        { label: "SO₂", value: r.pollutants.so2, unit: "µg/m³", limit: 80 },
                        { label: "NO₂", value: r.pollutants.no2, unit: "µg/m³", limit: 80 },
                      ].map((p) => (
                        <div key={p.label} className="rounded-lg bg-background p-2 text-center">
                          <p className="text-xs text-muted">{p.label}</p>
                          <p className={`text-lg font-bold ${p.value && p.value > p.limit ? "text-red-400" : "text-green-400"}`}>
                            {p.value ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted">{p.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Water Quality Tab */}
        {activeTab === "water" && (
          <div className="space-y-3">
            {waterData.map((r) => {
              const wColor = r.status === "Safe" ? "#22c55e" : r.status === "Caution" ? "#f59e0b" : r.status === "Polluted" ? "#f97316" : "#ef4444";
              return (
                <div key={r.stationId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Droplets size={20} style={{ color: wColor }} />
                      <div>
                        <p className="text-sm font-semibold text-white">💧 {r.riverName}</p>
                        <p className="text-xs text-muted">{r.stationName} • {r.city}</p>
                      </div>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: wColor }}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-xs text-muted">BOD</p>
                      <p className={`text-lg font-bold ${(r.parameters.bod ?? 0) > 3 ? "text-red-400" : "text-green-400"}`}>{r.parameters.bod ?? "—"}</p>
                      <p className="text-[10px] text-muted">mg/L</p>
                    </div>
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-xs text-muted">DO</p>
                      <p className={`text-lg font-bold ${(r.parameters.dissolvedOxygen ?? 0) < 5 ? "text-red-400" : "text-green-400"}`}>{r.parameters.dissolvedOxygen ?? "—"}</p>
                      <p className="text-[10px] text-muted">mg/L</p>
                    </div>
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-xs text-muted">pH</p>
                      <p className={`text-lg font-bold ${(r.parameters.ph ?? 7) < 6.5 || (r.parameters.ph ?? 7) > 8.5 ? "text-red-400" : "text-green-400"}`}>{r.parameters.ph ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-xs text-muted">Temp</p>
                      <p className="text-lg font-bold text-blue-400">{r.parameters.temperature ?? "—"}°C</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Noise Tab */}
        {activeTab === "noise" && (
          <div className="space-y-3">
            {noiseData.map((r) => (
              <div key={r.stationId} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className={r.exceedance ? "text-red-400" : "text-purple-400"} />
                    <div>
                      <p className="text-sm font-semibold text-white">{r.stationName}</p>
                      <p className="text-xs text-muted">{r.city} • {r.zone} Zone</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${r.exceedance ? "text-red-400" : "text-green-400"}`}>{r.leq} dB(A)</p>
                    <p className="text-[10px] text-muted">Limit: {r.limit} dB(A)</p>
                  </div>
                </div>
                {r.exceedance && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
                    <AlertTriangle size={12} /> Noise level exceeds {r.zone} zone {r.dayNight} limit by {(r.leq - r.limit).toFixed(1)} dB(A)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">About PrithviNet</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                PrithviNet is a smart environmental monitoring platform that tracks air quality,
                water quality, and noise levels across India in real-time. We source data from CPCB
                (Central Pollution Control Board) monitoring networks including CAAQMS for air, RTWQMS
                for water, and noise monitoring stations. Our AI-powered system provides forecasts,
                anomaly detection, and compliance tracking for industries.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Shield size={12} className="text-green-400" /> CPCB Data Standards</span>
                <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-400" /> Pan-India Coverage</span>
                <span className="flex items-center gap-1"><ExternalLink size={12} /> <a href="https://cpcb.nic.in" target="_blank" className="hover:text-primary">cpcb.nic.in</a></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border py-6 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} PrithviNet — Smart Environmental Monitoring & Compliance Platform</p>
        <p className="mt-1">Built for Hackathon | Air • Water • Noise</p>
      </footer>
    </div>
  );
}
