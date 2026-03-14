"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, TrendingUp, Calendar, Search, ChevronRight, ArrowUpRight, Clock, CheckCircle2, XCircle, FileWarning, Building2, Eye } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
type EscalationStatus = "Open" | "Escalated" | "Under Inspection" | "Notice Issued" | "Resolved" | "Closed";

interface ComplianceCase {
  id: string;
  entity: string;
  entityType: "Industry" | "Municipal" | "Government";
  region: string;
  category: "air" | "water" | "noise";
  parameter: string;
  value: number;
  limit: number;
  unit: string;
  severity: SeverityLevel;
  status: EscalationStatus;
  firstDetected: string;
  lastViolation: string;
  occurrences: number;
  assignedTo: string;
  escalationHistory: { date: string; action: string; by: string }[];
}

const CASES: ComplianceCase[] = [
  {
    id: "NC-2026-001", entity: "Tata Steel Works", entityType: "Industry", region: "Jharkhand", category: "air",
    parameter: "SO₂", value: 142, limit: 80, unit: "µg/m³", severity: "Critical", status: "Escalated",
    firstDetected: "2025-12-10", lastViolation: "2026-03-09", occurrences: 18, assignedTo: "Priya Sharma",
    escalationHistory: [
      { date: "2025-12-10", action: "Auto-alert triggered — SO₂ exceeded NAAQS limit", by: "System" },
      { date: "2025-12-15", action: "Warning notice sent to industry", by: "Arun Patel" },
      { date: "2026-01-05", action: "Repeat violation — escalated to Regional Officer", by: "System" },
      { date: "2026-01-20", action: "Inspection scheduled", by: "Priya Sharma" },
      { date: "2026-02-10", action: "Show-cause notice issued; improvement timeline: 60 days", by: "Priya Sharma" },
    ],
  },
  {
    id: "NC-2026-002", entity: "Hindalco Aluminium Smelter", entityType: "Industry", region: "Uttar Pradesh", category: "air",
    parameter: "PM₂.₅", value: 265, limit: 60, unit: "µg/m³", severity: "Critical", status: "Notice Issued",
    firstDetected: "2026-01-02", lastViolation: "2026-03-08", occurrences: 28, assignedTo: "Rahul Nair",
    escalationHistory: [
      { date: "2026-01-02", action: "Auto-alert: PM₂.₅ at 210 µg/m³", by: "System" },
      { date: "2026-01-10", action: "Warning issued", by: "Rahul Nair" },
      { date: "2026-01-25", action: "Continued violations — escalated", by: "System" },
      { date: "2026-02-15", action: "Site inspection completed; gross violations found", by: "UPPCB Team" },
      { date: "2026-02-20", action: "Closure notice issued under Section 33A", by: "Dr. Rajesh Kumar" },
    ],
  },
  {
    id: "NC-2026-003", entity: "Mumbai Municipal Sewage Plant", entityType: "Municipal", region: "Maharashtra", category: "water",
    parameter: "BOD", value: 45, limit: 30, unit: "mg/L", severity: "High", status: "Under Inspection",
    firstDetected: "2026-02-01", lastViolation: "2026-03-07", occurrences: 8, assignedTo: "Priya Sharma",
    escalationHistory: [
      { date: "2026-02-01", action: "BOD exceeded Class C discharge standard", by: "System" },
      { date: "2026-02-08", action: "Notice sent to BMC", by: "Priya Sharma" },
      { date: "2026-03-01", action: "Inspection team dispatched", by: "MPCB Mumbai Team" },
    ],
  },
  {
    id: "NC-2026-004", entity: "Ambuja Cements", entityType: "Industry", region: "Gujarat", category: "air",
    parameter: "PM₁₀", value: 185, limit: 100, unit: "µg/m³", severity: "High", status: "Open",
    firstDetected: "2026-03-05", lastViolation: "2026-03-09", occurrences: 3, assignedTo: "Rakesh Gupta",
    escalationHistory: [
      { date: "2026-03-05", action: "Auto-alert: PM₁₀ at 172 µg/m³", by: "System" },
      { date: "2026-03-07", action: "Warning notice generated", by: "System" },
    ],
  },
  {
    id: "NC-2026-005", entity: "Peenya Industrial Complex", entityType: "Industry", region: "Karnataka", category: "noise",
    parameter: "Leq (Night)", value: 68, limit: 55, unit: "dB(A)", severity: "Medium", status: "Resolved",
    firstDetected: "2026-01-15", lastViolation: "2026-02-10", occurrences: 6, assignedTo: "Suresh Reddy",
    escalationHistory: [
      { date: "2026-01-15", action: "Night-time Leq exceeded industrial zone limit", by: "System" },
      { date: "2026-01-22", action: "Warning notice sent; deadline: 30 days", by: "Suresh Reddy" },
      { date: "2026-02-20", action: "Noise barriers installed — compliance verified", by: "KSPCB Team A" },
      { date: "2026-02-25", action: "Case resolved — monitoring continues", by: "Suresh Reddy" },
    ],
  },
  {
    id: "NC-2026-006", entity: "Rajasthan Dye Works", entityType: "Industry", region: "Rajasthan", category: "water",
    parameter: "pH", value: 10.2, limit: 9, unit: "", severity: "High", status: "Escalated",
    firstDetected: "2026-02-20", lastViolation: "2026-03-06", occurrences: 5, assignedTo: "Kavita Joshi",
    escalationHistory: [
      { date: "2026-02-20", action: "pH exceeded permissible range (6.5–8.5)", by: "System" },
      { date: "2026-02-25", action: "Warning to facility", by: "RPCB Team" },
      { date: "2026-03-01", action: "Escalated to State Pollution Control Board", by: "System" },
    ],
  },
  {
    id: "NC-2026-007", entity: "Reliance Jamnagar Refinery", entityType: "Industry", region: "Gujarat", category: "air",
    parameter: "NO₂", value: 95, limit: 80, unit: "µg/m³", severity: "Medium", status: "Open",
    firstDetected: "2026-03-08", lastViolation: "2026-03-10", occurrences: 2, assignedTo: "Rakesh Gupta",
    escalationHistory: [
      { date: "2026-03-08", action: "NO₂ marginally exceeded annual standard", by: "System" },
    ],
  },
  {
    id: "NC-2026-008", entity: "AIIMS Hospital Zone", entityType: "Government", region: "Delhi", category: "noise",
    parameter: "Leq (Day)", value: 58, limit: 50, unit: "dB(A)", severity: "Low", status: "Closed",
    firstDetected: "2025-11-01", lastViolation: "2025-12-15", occurrences: 4, assignedTo: "Arun Patel",
    escalationHistory: [
      { date: "2025-11-01", action: "Silence zone limit exceeded", by: "System" },
      { date: "2025-11-10", action: "Traffic rerouting requested to Delhi Traffic Police", by: "DPCC" },
      { date: "2025-12-20", action: "Noise levels normalized; case closed", by: "Arun Patel" },
    ],
  },
];

const severityColor: Record<SeverityLevel, string> = { Critical: "text-red-400 bg-red-500/15", High: "text-orange-400 bg-orange-500/15", Medium: "text-yellow-400 bg-yellow-500/15", Low: "text-blue-400 bg-blue-500/15" };
const statusColor: Record<EscalationStatus, string> = {
  Open: "text-blue-400 bg-blue-500/15",
  Escalated: "text-orange-400 bg-orange-500/15",
  "Under Inspection": "text-yellow-400 bg-yellow-500/15",
  "Notice Issued": "text-red-400 bg-red-500/15",
  Resolved: "text-green-400 bg-green-500/15",
  Closed: "text-gray-400 bg-gray-500/15",
};

export default function CompliancePage() {
  const { data: cases } = useSupabaseCRUD<ComplianceCase>("compliance_cases", CASES);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<ComplianceCase | null>(null);

  const filtered = cases.filter((c) => {
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return c.entity.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase()) || c.parameter.toLowerCase().includes(search.toLowerCase());
  });

  const openCritical = cases.filter((c) => c.severity === "Critical" && c.status !== "Resolved" && c.status !== "Closed").length;
  const totalOpen = cases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
  const totalViolations = cases.reduce((s, c) => s + c.occurrences, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Compliance & Escalation Dashboard</h1>
        <p className="text-sm text-muted">Track non-compliance cases, escalation timelines, and enforcement actions</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            <p className="text-2xl font-bold text-red-400">{openCritical}</p>
          </div>
          <p className="text-xs text-muted">Critical Open Cases</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">{totalOpen}</p>
          </div>
          <p className="text-xs text-muted">Total Open Cases</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-yellow-400" />
            <p className="text-2xl font-bold text-white">{totalViolations}</p>
          </div>
          <p className="text-xs text-muted">Total Violation Events</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <p className="text-2xl font-bold text-green-400">{cases.filter((c) => c.status === "Resolved" || c.status === "Closed").length}</p>
          </div>
          <p className="text-xs text-muted">Resolved / Closed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input type="text" placeholder="Search entity, region, parameter..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["all", "Critical", "High", "Medium", "Low"].map((s) => (
            <button key={s} onClick={() => setFilterSeverity(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterSeverity === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
              {s === "all" ? "All Severity" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "Open", "Escalated", "Under Inspection", "Notice Issued", "Resolved"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterStatus === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Case list */}
        <div className="lg:col-span-2">
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} onClick={() => setSelected(c)} className={`cursor-pointer rounded-xl border p-4 transition-colors ${selected?.id === c.id ? "border-primary bg-card" : "border-border bg-card hover:border-border/80"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-muted" />
                      <h3 className="text-sm font-semibold text-white">{c.entity}</h3>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">{c.id} · {c.region} · {c.entityType}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${severityColor[c.severity]}`}>{c.severity}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusColor[c.status]}`}>{c.status}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                  <span className="font-medium text-white">{c.parameter}: {c.value} {c.unit}</span>
                  <span className="text-red-400">Limit: {c.limit} {c.unit}</span>
                  <span>({c.occurrences} occurrences)</span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><Calendar size={10} /> First: {c.firstDetected}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Last: {c.lastViolation}</span>
                  <span>Assigned: {c.assignedTo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation timeline */}
        <div>
          {selected ? (
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
              <h3 className="mb-1 text-sm font-semibold text-white">{selected.entity}</h3>
              <p className="text-xs text-muted">{selected.id} — {selected.parameter} Non-Compliance</p>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
                <AlertTriangle size={14} className="text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-400">{selected.value} {selected.unit}</p>
                  <p className="text-[10px] text-muted">Prescribed Limit: {selected.limit} {selected.unit} ({Math.round(((selected.value - selected.limit) / selected.limit) * 100)}% over)</p>
                </div>
              </div>

              <h4 className="mb-2 mt-4 text-xs font-semibold text-muted">ESCALATION TIMELINE</h4>
              <div className="relative space-y-3 pl-4">
                <div className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-border" />
                {selected.escalationHistory.map((e, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-4 top-1.5 h-2 w-2 rounded-full ${i === selected.escalationHistory.length - 1 ? "bg-primary" : "bg-muted"}`} />
                    <p className="text-[10px] text-muted">{e.date} — {e.by}</p>
                    <p className="text-xs text-white">{e.action}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg bg-orange-500/20 py-2 text-xs font-medium text-orange-400 hover:bg-orange-500/30">Escalate</button>
                <button className="flex-1 rounded-lg bg-green-500/20 py-2 text-xs font-medium text-green-400 hover:bg-green-500/30">Resolve</button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <ShieldAlert size={32} className="mx-auto mb-3 text-muted" />
              <p className="text-sm text-muted">Select a case to view escalation timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
