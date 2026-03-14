"use client";

import { useEffect, useState } from "react";
import {
  Wind,
  Droplets,
  Volume2,
  Factory,
  AlertTriangle,
  Activity,
  Radio,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import AQIGauge from "@/components/AQIGauge";
import { PollutionChart } from "@/components/Charts";
import {
  fetchMergedAirData,
  generateWaterData,
  generateNoiseData,
  generateIndustryData,
  generateAlerts,
  getDashboardStats,
  generateTimeSeries,
  getAQIColor,
} from "@/lib/api";
import type { AQIReading, WaterReading, NoiseReading, Alert, DashboardStats } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const [airData, setAirData] = useState<AQIReading[]>([]);
  const [waterData, setWaterData] = useState<WaterReading[]>([]);
  const [noiseData, setNoiseData] = useState<NoiseReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const loadData = async () => {
    const [air, water] = await Promise.all([fetchMergedAirData(), generateWaterData()]);
    const noise = generateNoiseData();
    const industries = generateIndustryData();
    const alertList = generateAlerts(air, water, noise);
    const dashStats = getDashboardStats(air, alertList, industries, water.length, noise.length);

    setAirData(air);
    setWaterData(water);
    setNoiseData(noise);
    setAlerts(alertList);
    setStats(dashStats);
    setLastUpdate(new Date().toLocaleTimeString("en-IN"));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
          <p className="text-sm text-zinc-500">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  const pm25History = generateTimeSeries(24, stats?.avgAQI || 120);
  const topCritical = alerts.filter((a) => a.severity === "Critical").slice(0, 3);

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-zinc-500">Welcome back</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-white">
            Environmental Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitoring <span className="text-zinc-300">{airData.length} stations</span> across India in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1.5">
            <span className="h-2 w-2 animate-pulse-live rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
          <span className="text-xs text-zinc-500">Updated {lastUpdate}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Stations" value={stats?.totalStations || 0} subtitle={`${stats?.liveStations || 0} currently live`} icon={<Radio size={18} />} color="blue" />
        <StatCard title="Avg. AQI" value={stats?.avgAQI || 0} subtitle="National average" icon={<Wind size={18} />} color={stats?.avgAQI && stats.avgAQI > 200 ? "red" : "yellow"} trend={{ value: 5.2, label: "vs yesterday" }} />
        <StatCard title="Active Alerts" value={stats?.activeAlerts || 0} subtitle={`${stats?.criticalAlerts || 0} critical`} icon={<AlertTriangle size={18} />} color="red" />
        <StatCard title="Compliance" value={`${stats?.complianceRate || 0}%`} subtitle={`${stats?.industriesMonitored || 0} industries tracked`} icon={<Factory size={18} />} color="green" />
      </div>

      {/* Chart + Top Cities */}
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PollutionChart data={pm25History} title="PM₂.₅ — 24h Trend" color="#f59e0b" unit="µg/m³" limit={60} height={300} />
        </div>

        {/* Top cities AQI */}
        <div className="glass rounded-2xl p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">City Air Quality</h3>
            <Link href="/map" className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-emerald-400">
              View map <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {airData.slice(0, 6).map((r, i) => (
              <div key={r.stationId} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
                <span className="w-5 text-xs text-zinc-500">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{r.city}</p>
                  <p className="truncate text-xs text-zinc-500">{r.stationName}</p>
                </div>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1"
                  style={{ backgroundColor: getAQIColor(r.aqi) + "15" }}
                >
                  <span className="text-sm font-semibold" style={{ color: getAQIColor(r.aqi) }}>{r.aqi}</span>
                  <span className="text-[11px]" style={{ color: getAQIColor(r.aqi) }}>{r.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Station AQI Overview — compact row */}
      <div className="mb-8 glass rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity size={15} className="text-emerald-400" />
            Station Overview
          </h3>
          <span className="text-xs text-zinc-500">{airData.length} stations monitored</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {airData.slice(0, 10).map((r) => (
            <AQIGauge key={r.stationId} value={r.aqi} size="sm" stationName={r.city} />
          ))}
        </div>
      </div>

      {/* Water + Noise + Alerts — 3 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Water Quality */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Droplets size={15} className="text-blue-400" />
              Water Quality
            </h3>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] text-blue-400">
              {waterData.length} rivers
            </span>
          </div>
          <div className="space-y-2">
            {waterData.slice(0, 5).map((r) => (
              <div key={r.stationId} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{r.riverName}</p>
                  <p className="truncate text-xs text-zinc-500">{r.stationName}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.status === "Safe" ? "bg-emerald-500/15 text-emerald-400" : r.status === "Caution" ? "bg-yellow-500/15 text-yellow-400" : r.status === "Polluted" ? "bg-orange-500/15 text-orange-400" : "bg-red-500/15 text-red-400"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Noise Monitoring */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Volume2 size={15} className="text-purple-400" />
              Noise Levels
            </h3>
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] text-purple-400">
              {noiseData.length} stations
            </span>
          </div>
          <div className="space-y-2">
            {noiseData.slice(0, 5).map((r) => (
              <div key={r.stationId} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{r.stationName}</p>
                  <p className="truncate text-xs text-zinc-500">{r.zone} • {r.limit} dB limit</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${r.exceedance ? "text-red-400" : "text-emerald-400"}`}>{r.leq} dB</span>
                  {r.exceedance && <p className="text-[11px] text-red-400">Exceeded</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle size={15} className="text-red-400" />
              Critical Alerts
            </h3>
            {topCritical.length > 0 && (
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] text-red-400">
                {topCritical.length} active
              </span>
            )}
          </div>
          {topCritical.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Activity size={20} className="text-emerald-400" />
              </div>
              <p className="text-sm text-zinc-300">All clear</p>
              <p className="text-xs text-zinc-500">No critical alerts right now</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topCritical.map((a) => (
                <div key={a.id} className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200">{a.title}</p>
                    <span className="shrink-0 rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-400">{a.type}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">{a.region}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {a.parameter}: <span className="text-zinc-400">{a.value}</span> <span className="text-zinc-600">/ Limit: {a.limit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
