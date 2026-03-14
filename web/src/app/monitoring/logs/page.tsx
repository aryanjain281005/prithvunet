"use client";

import { useState } from "react";
import { FileText, Search, Download, Filter, Wind, Droplets, Volume2, Factory, Calendar, Eye } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface MonitoringLog {
  id: string;
  type: "air" | "water" | "noise" | "industry";
  station: string;
  region: string;
  date: string;
  submittedBy: string;
  team: string;
  status: "Complete" | "Partial" | "Pending Review" | "Missing";
  summary: string;
  parameters: number;
  violations: number;
}

const LOGS: MonitoringLog[] = [
  { id: "LOG001", type: "air", station: "Anand Vihar CAAQMS", region: "Delhi", date: "2026-03-10", submittedBy: "Arun Patel", team: "DPCC Field Team A", status: "Complete", summary: "All 7 parameters recorded. PM₂.₅ elevated (185 µg/m³).", parameters: 7, violations: 2 },
  { id: "LOG002", type: "air", station: "ITO Junction CAAQMS", region: "Delhi", date: "2026-03-10", submittedBy: "Meena Devi", team: "DPCC Field Team B", status: "Complete", summary: "Standard readings. All within normal range.", parameters: 7, violations: 0 },
  { id: "LOG003", type: "water", station: "Yamuna at Okhla RTWQMS", region: "Delhi", date: "2026-03-10", submittedBy: "Kavita Joshi", team: "DPCC Water Team", status: "Pending Review", summary: "BOD 8.5 mg/L — exceeds Class C limit. DO critically low.", parameters: 6, violations: 2 },
  { id: "LOG004", type: "noise", station: "Peenya Industrial NMS", region: "Karnataka", date: "2026-03-10", submittedBy: "Suresh Reddy", team: "KSPCB Team A", status: "Complete", summary: "Leq 72 dB(A) — within industrial zone limits.", parameters: 3, violations: 0 },
  { id: "LOG005", type: "industry", station: "Tata Steel Works", region: "Jharkhand", date: "2026-03-09", submittedBy: "Vikram Singh", team: "Industry Self-Report", status: "Pending Review", summary: "Daily emissions log. SO₂ near upper limit.", parameters: 4, violations: 1 },
  { id: "LOG006", type: "water", station: "Ganga at Varanasi RTWQMS", region: "Uttar Pradesh", date: "2026-03-09", submittedBy: "Rahul Nair", team: "UPPCB Water Team", status: "Complete", summary: "Good quality — DO 6.8, BOD 2.1.", parameters: 6, violations: 0 },
  { id: "LOG007", type: "air", station: "Bandra CAAQMS", region: "Maharashtra", date: "2026-03-09", submittedBy: "Priya Sharma", team: "MPCB Mumbai Team", status: "Complete", summary: "Moderate AQI. PM₁₀ slightly elevated.", parameters: 7, violations: 1 },
  { id: "LOG008", type: "air", station: "BTM Layout CAAQMS", region: "Karnataka", date: "2026-03-09", submittedBy: "Kavita Joshi", team: "KSPCB Team B", status: "Missing", summary: "No data received — sensor maintenance.", parameters: 0, violations: 0 },
  { id: "LOG009", type: "industry", station: "Ambuja Cements", region: "Gujarat", date: "2026-03-09", submittedBy: "Rakesh Gupta", team: "Industry Self-Report", status: "Complete", summary: "PM emissions 95 mg/Nm³ — within limits.", parameters: 4, violations: 0 },
  { id: "LOG010", type: "noise", station: "AIIMS Hospital NMS", region: "Delhi", date: "2026-03-08", submittedBy: "Arun Patel", team: "DPCC Noise Team", status: "Complete", summary: "Silence zone Leq 48 dB(A) — marginal.", parameters: 3, violations: 0 },
  { id: "LOG011", type: "water", station: "Sabarmati RTWQMS", region: "Gujarat", date: "2026-03-08", submittedBy: "Arun Patel", team: "GPCB Water Team", status: "Partial", summary: "DO and BOD recorded; other params sensor error.", parameters: 3, violations: 1 },
  { id: "LOG012", type: "air", station: "Jubilee Hills CAAQMS", region: "Telangana", date: "2026-03-08", submittedBy: "Suresh Reddy", team: "TSPCB Team A", status: "Complete", summary: "Good AQI (65). All parameters within limits.", parameters: 7, violations: 0 },
];

const typeConfig = {
  air: { icon: Wind, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  water: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/15" },
  noise: { icon: Volume2, color: "text-purple-400", bg: "bg-purple-500/15" },
  industry: { icon: Factory, color: "text-orange-400", bg: "bg-orange-500/15" },
};

const statusStyle = {
  Complete: "bg-green-500/20 text-green-400",
  Partial: "bg-yellow-500/20 text-yellow-400",
  "Pending Review": "bg-blue-500/20 text-blue-400",
  Missing: "bg-red-500/20 text-red-400",
};

export default function LogsPage() {
  const { data: logs } = useSupabaseCRUD<MonitoringLog>("monitoring_logs", LOGS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<MonitoringLog | null>(null);

  const filtered = logs.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    return l.station.toLowerCase().includes(search.toLowerCase()) || l.region.toLowerCase().includes(search.toLowerCase()) || l.submittedBy.toLowerCase().includes(search.toLowerCase());
  });

  const totalViolations = logs.reduce((s, l) => s + l.violations, 0);
  const missingCount = logs.filter((l) => l.status === "Missing").length;
  const pendingCount = logs.filter((l) => l.status === "Pending Review").length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring Logs</h1>
          <p className="text-sm text-muted">Industrial and station monitoring logs with audit trail</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm text-muted hover:text-white">
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-white">{logs.length}</p>
          <p className="text-xs text-muted">Total Logs</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-2xl font-bold text-red-400">{totalViolations}</p>
          <p className="text-xs text-muted">Violations Found</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-2xl font-bold text-yellow-400">{missingCount}</p>
          <p className="text-xs text-muted">Missing Reports</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-2xl font-bold text-blue-400">{pendingCount}</p>
          <p className="text-xs text-muted">Pending Review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input type="text" placeholder="Search station, region, team..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["all", "air", "water", "noise", "industry"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterType === t ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "Complete", "Pending Review", "Missing"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterStatus === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-muted">Station</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Submitted By</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Params</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Violations</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const cfg = typeConfig[log.type];
              const Icon = cfg.icon;
              return (
                <tr key={log.id} onClick={() => setSelectedLog(log)} className={`cursor-pointer border-b border-border transition-colors hover:bg-card-hover ${selectedLog?.id === log.id ? "bg-card-hover" : "bg-background"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded p-1 ${cfg.bg}`}><Icon size={12} className={cfg.color} /></div>
                      <div>
                        <p className="font-medium text-white">{log.station}</p>
                        <p className="text-[10px] text-muted">{log.region}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{log.type}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{log.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted">{log.submittedBy}</p>
                    <p className="text-[10px] text-muted">{log.team}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-white">{log.parameters}</td>
                  <td className="px-4 py-3">
                    {log.violations > 0 ? <span className="text-xs font-bold text-red-400">{log.violations}</span> : <span className="text-xs text-green-400">0</span>}
                  </td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusStyle[log.status]}`}>{log.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected log detail */}
      {selectedLog && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{selectedLog.station} — {selectedLog.date}</h3>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusStyle[selectedLog.status]}`}>{selectedLog.status}</span>
          </div>
          <p className="mt-2 text-xs text-muted">{selectedLog.summary}</p>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span>Team: {selectedLog.team}</span>
            <span>Submitted by: {selectedLog.submittedBy}</span>
            <span>{selectedLog.parameters} parameters recorded</span>
            {selectedLog.violations > 0 && <span className="text-red-400">{selectedLog.violations} violations</span>}
          </div>
        </div>
      )}
    </div>
  );
}
