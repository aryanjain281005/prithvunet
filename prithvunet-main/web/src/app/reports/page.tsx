"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, FileText, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  fetchMergedAirData,
  generateWaterData,
  generateNoiseData,
  generateTimeSeries,
  generateForecast,
} from "@/lib/api";
import { PollutionChart, ForecastChart } from "@/components/Charts";
import type { AQIReading, WaterReading, NoiseReading } from "@/lib/types";

interface PeriodicReport {
  id: string;
  title: string;
  period: string;
  type: "Monthly" | "Quarterly" | "Annual";
  region: string;
  status: "Published" | "Draft" | "Overdue";
  generatedOn: string;
  pages: number;
  highlights: string;
}

const PERIODIC_REPORTS: PeriodicReport[] = [
  { id: "RPT001", title: "Delhi NCR Air Quality Monthly Report", period: "February 2026", type: "Monthly", region: "Delhi NCR", status: "Published", generatedOn: "2026-03-05", pages: 24, highlights: "Average AQI improved by 12% vs January. PM₂.₅ still exceeds NAAQS at 8 of 15 stations." },
  { id: "RPT002", title: "Maharashtra Water Quality Monthly Report", period: "February 2026", type: "Monthly", region: "Maharashtra", status: "Published", generatedOn: "2026-03-04", pages: 18, highlights: "Mithi River BOD remains critical. Godavari tributaries showing improvement in DO levels." },
  { id: "RPT003", title: "Karnataka Noise Monitoring Monthly Report", period: "February 2026", type: "Monthly", region: "Karnataka", status: "Draft", generatedOn: "2026-03-08", pages: 12, highlights: "Peenya Industrial noise barriers showing 15% reduction. Hospital zone compliance achieved." },
  { id: "RPT004", title: "National Air Quality Quarterly Report", period: "Q4 2025 (Oct–Dec)", type: "Quarterly", region: "Pan India", status: "Published", generatedOn: "2026-01-15", pages: 56, highlights: "Diwali spike worst in 3 years. Winter smog affected 12 states. GRAP measures activated 3 times in Delhi." },
  { id: "RPT005", title: "Uttar Pradesh Water Quality Quarterly Report", period: "Q4 2025 (Oct–Dec)", type: "Quarterly", region: "Uttar Pradesh", status: "Published", generatedOn: "2026-01-20", pages: 34, highlights: "Ganga quality improved post-monsoon. Industrial discharge still a concern in Kanpur stretch." },
  { id: "RPT006", title: "National Environmental Status Annual Report", period: "FY 2024–25", type: "Annual", region: "Pan India", status: "Published", generatedOn: "2025-06-30", pages: 142, highlights: "Air quality improved in 60% of cities. Water quality remains concern in Yamuna, Mithi. Noise compliance at 45%." },
  { id: "RPT007", title: "Gujarat Industrial Emissions Monthly Report", period: "March 2026", type: "Monthly", region: "Gujarat", status: "Overdue", generatedOn: "", pages: 0, highlights: "Report pending — data collection in progress." },
  { id: "RPT008", title: "Delhi NCR Air Quality Monthly Report", period: "March 2026", type: "Monthly", region: "Delhi NCR", status: "Draft", generatedOn: "2026-03-10", pages: 8, highlights: "Partial data — 10 days covered. Preliminary AQI average: 178." },
];

const reportStatusColor: Record<string, string> = {
  Published: "bg-green-500/15 text-green-400",
  Draft: "bg-blue-500/15 text-blue-400",
  Overdue: "bg-red-500/15 text-red-400",
};

export default function ReportsPage() {
  const [airData, setAirData] = useState<AQIReading[]>([]);
  const [waterData, setWaterData] = useState<WaterReading[]>([]);
  const [noiseData, setNoiseData] = useState<NoiseReading[]>([]);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"analytics" | "periodic">("analytics");
  const [reportFilter, setReportFilter] = useState<string>("all");

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

  const hoursMap = { "24h": 24, "7d": 168, "30d": 720 };
  const hours = hoursMap[timeRange];

  const pm25Series = generateTimeSeries(hours, 85);
  const pm10Series = generateTimeSeries(hours, 140);
  const bodSeries = generateTimeSeries(hours, 4);

  const avgAQI = airData.length > 0 ? Math.round(airData.reduce((s, r) => s + r.aqi, 0) / airData.length) : 0;
  const maxAQI = airData.length > 0 ? Math.max(...airData.map((r) => r.aqi)) : 0;
  const waterViolations = waterData.filter((w) => w.status === "Polluted" || w.status === "Critical").length;
  const noiseViolations = noiseData.filter((n) => n.exceedance).length;

  const forecastData = generateForecast(avgAQI || 150);

  const filteredReports = PERIODIC_REPORTS.filter((r) => {
    if (reportFilter === "all") return true;
    return r.type === reportFilter;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-muted">Trend analysis, forecasts, periodic reports, and compliance analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("analytics")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${tab === "analytics" ? "bg-primary text-white" : "bg-card text-muted hover:text-white"}`}>
            <BarChart3 size={14} /> Analytics
          </button>
          <button onClick={() => setTab("periodic")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${tab === "periodic" ? "bg-primary text-white" : "bg-card text-muted hover:text-white"}`}>
            <FileText size={14} /> Periodic Reports
          </button>
        </div>
      </div>

      {tab === "analytics" ? (
        <>
          {/* Time range selector */}
          <div className="mb-6 flex gap-2">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button key={r} onClick={() => setTimeRange(r)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${timeRange === r ? "bg-primary text-white" : "text-muted hover:text-white"}`}>{r}</button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Average AQI</p>
              <p className="text-2xl font-bold text-white">{avgAQI}</p>
              <p className="mt-1 text-xs text-green-400">↓ 8% vs last period</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Peak AQI</p>
              <p className="text-2xl font-bold text-red-400">{maxAQI}</p>
              <p className="mt-1 text-xs text-muted">Worst recorded</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Water Violations</p>
              <p className="text-2xl font-bold text-blue-400">{waterViolations}</p>
              <p className="mt-1 text-xs text-muted">Out of {waterData.length} stations</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Noise Violations</p>
              <p className="text-2xl font-bold text-purple-400">{noiseViolations}</p>
              <p className="mt-1 text-xs text-muted">Exceeding limits</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PollutionChart data={pm25Series} title={`PM₂.₅ Trend (${timeRange})`} color="#f59e0b" unit="µg/m³" limit={60} type="area" />
            <PollutionChart data={pm10Series} title={`PM₁₀ Trend (${timeRange})`} color="#3b82f6" unit="µg/m³" limit={100} type="area" />
            <ForecastChart data={forecastData} title="72-Hour AQI Forecast" />
            <PollutionChart data={bodSeries} title={`BOD Water Quality (${timeRange})`} color="#22d3ee" unit="mg/L" limit={3} type="line" />
          </div>

          {/* City Comparison Table */}
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">City-wise AQI Comparison</p>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-xs font-medium text-muted">City</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">AQI</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">PM₂.₅</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">PM₁₀</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">SO₂</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">NO₂</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {airData.slice(0, 12).map((r) => (
                    <tr key={r.stationId} className="border-b border-border/50">
                      <td className="px-3 py-2 font-medium text-white">{r.city}</td>
                      <td className="px-3 py-2">
                        <span className="inline-block rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: r.aqi > 300 ? "#991b1b" : r.aqi > 200 ? "#ef4444" : r.aqi > 100 ? "#f97316" : "#22c55e" }}>
                          {r.aqi}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{r.pollutants.pm25 ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{r.pollutants.pm10 ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{r.pollutants.so2 ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{r.pollutants.no2 ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted">{r.dominantPollutant?.toUpperCase() ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Periodic Reports Tab */
        <>
          {/* Report stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-2xl font-bold text-white">{PERIODIC_REPORTS.length}</p>
              <p className="text-xs text-muted">Total Reports</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-2xl font-bold text-green-400">{PERIODIC_REPORTS.filter((r) => r.status === "Published").length}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-2xl font-bold text-blue-400">{PERIODIC_REPORTS.filter((r) => r.status === "Draft").length}</p>
              <p className="text-xs text-muted">In Draft</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-2xl font-bold text-red-400">{PERIODIC_REPORTS.filter((r) => r.status === "Overdue").length}</p>
              <p className="text-xs text-muted">Overdue</p>
            </div>
          </div>

          {/* Report type filter */}
          <div className="mb-4 flex gap-2">
            {["all", "Monthly", "Quarterly", "Annual"].map((f) => (
              <button key={f} onClick={() => setReportFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${reportFilter === f ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
                {f === "all" ? "All Types" : f}
              </button>
            ))}
          </div>

          {/* Reports list */}
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/5 p-2">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{report.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {report.period}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${report.type === "Monthly" ? "bg-blue-500/15 text-blue-400" : report.type === "Quarterly" ? "bg-purple-500/15 text-purple-400" : "bg-green-500/15 text-green-400"}`}>{report.type}</span>
                        <span>{report.region}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">{report.highlights}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${reportStatusColor[report.status]}`}>{report.status}</span>
                    {report.status === "Published" && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{report.pages} pages</span>
                        <button className="flex items-center gap-1 rounded bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/30">
                          <Download size={10} /> Download
                        </button>
                      </div>
                    )}
                    {report.generatedOn && <p className="text-[10px] text-muted">Generated: {report.generatedOn}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
