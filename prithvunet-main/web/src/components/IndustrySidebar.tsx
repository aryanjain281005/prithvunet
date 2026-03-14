"use client";

import dynamic from "next/dynamic";
import { AlertTriangle, Factory, MapPin, X } from "lucide-react";
import { useIndustry } from "@/components/IndustryContext";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);

function formatDateTime(value: string) {
  if (!value) {
    return "Not available";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function progressWidth(currentValue: number, limit: number) {
  if (!limit) {
    return 0;
  }
  return Math.min(100, Math.round((currentValue / limit) * 100));
}

export default function IndustrySidebar() {
  const {
    closeSidebar,
    loadingDetail,
    panelOpen,
    selectedIndustry,
    selectedIndustrySummary,
    sidebarOpen,
  } = useIndustry();

  const summary = selectedIndustry?.industry || selectedIndustrySummary;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-[1300] w-full max-w-[380px] border-l border-white/10 bg-[#060b14]/96 shadow-2xl backdrop-blur-2xl transition-transform duration-300 lg:max-w-[400px] ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      } ${panelOpen ? "lg:right-[26rem]" : ""}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Industry Details</p>
            <h2 className="mt-1 text-lg font-semibold text-white">CPCB RTDMS</h2>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {loadingDetail && !selectedIndustry ? (
            <div className="space-y-3">
              <div className="industry-shimmer h-24 rounded-2xl bg-white/[0.05]" />
              <div className="industry-shimmer h-36 rounded-2xl bg-white/[0.05]" />
              <div className="industry-shimmer h-40 rounded-2xl bg-white/[0.05]" />
            </div>
          ) : null}

          {!summary && !loadingDetail ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
              Select an industry marker or a table row to inspect CPCB RTDMS readings.
            </div>
          ) : null}

          {summary ? (
            <>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-300">
                      <Factory size={12} /> Industry
                    </div>
                    <h3 className="text-xl font-semibold text-white">{summary.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {summary.city}, {summary.state}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: summary.complianceColor }}
                  >
                    {summary.complianceStatus}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-zinc-500">Category</p>
                    <p className="mt-1 text-sm text-white">{summary.category || "Unknown"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-zinc-500">Last Update</p>
                    <p className="mt-1 text-sm text-white">{formatDateTime(summary.lastDataTime)}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <MapPin size={13} />
                      <span>Map position</span>
                    </div>
                    <p className="mt-1 text-sm text-white">
                      {summary.locationSource === "geocoded-city"
                        ? "City-level GPS (Nominatim/OpenStreetMap)"
                        : "State centroid estimate (RTDMS has no coordinates)"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{summary.address || "Address not published in the RTDMS public feed."}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-sm font-semibold text-white">Mini Map</p>
                  <p className="text-xs text-zinc-500">
                    {summary.locationSource === "geocoded-city"
                      ? "City centre — geocoded from RTDMS city/state field"
                      : "Approximate — RTDMS does not publish GPS coordinates"}
                  </p>
                </div>
                <div className="h-48">
                  <MapContainer center={[summary.lat, summary.lng]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[summary.lat, summary.lng]} />
                  </MapContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Monitored Parameters</p>
                    <p className="text-xs text-zinc-500">NAAQS-aligned checks from available RTDMS readings</p>
                  </div>
                  {selectedIndustry?.error ? (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-200">
                      Cached / offline
                    </span>
                  ) : null}
                </div>

                {selectedIndustry?.compliance.parameters.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedIndustry.compliance.parameters.map((parameter) => {
                      const progress = progressWidth(parameter.currentValue, parameter.limit);
                      return (
                        <div key={`${parameter.key}-${parameter.stationName}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{parameter.label}</p>
                              <p className="mt-1 text-xs text-zinc-500">{parameter.stationName}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${parameter.isViolation ? "text-red-300" : "text-emerald-300"}`}>
                                {parameter.currentValue} {parameter.unit}
                              </p>
                              <p className="text-[11px] text-zinc-500">Limit {parameter.limit} {parameter.unit}</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-white/10">
                            <div
                              className={`h-2 rounded-full ${parameter.isViolation ? "bg-red-400" : "bg-emerald-400"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{parameter.isViolation ? "Limit exceeded" : "Within limit"}</span>
                            <span>{formatDateTime(parameter.lastUpdated)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5" />
                      <div>
                        <p className="font-medium">No usable SO2, NOx, PM2.5, PM10, or CO data was found for this industry.</p>
                        <p className="mt-1 text-xs text-amber-100/80">
                          The public RTDMS feed often exposes water-treatment parameters only. Those industries remain marked as Unknown.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}