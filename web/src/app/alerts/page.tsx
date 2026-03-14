"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Wind,
  Droplets,
  Volume2,
  Factory,
  ArrowUpRight,
  FileWarning,
  Send,
} from "lucide-react";
import {
  fetchMergedAirData,
  generateWaterData,
  generateNoiseData,
  generateAlerts,
} from "@/lib/api";
import type { Alert, AlertType, AlertSeverity } from "@/lib/types";

const typeIcons = {
  air: <Wind size={14} />,
  water: <Droplets size={14} />,
  noise: <Volume2 size={14} />,
  industry: <Factory size={14} />,
};

const severityStyles = {
  Critical: "border-red-500/30 bg-red-500/5",
  Warning: "border-yellow-500/30 bg-yellow-500/5",
  Info: "border-blue-500/30 bg-blue-500/5",
};

const severityBadge = {
  Critical: "bg-red-500/20 text-red-400",
  Warning: "bg-yellow-500/20 text-yellow-400",
  Info: "bg-blue-500/20 text-blue-400",
};

interface MissingReport {
  id: string;
  station: string;
  region: string;
  type: "air" | "water" | "noise";
  dueDate: string;
  assignedTeam: string;
  daysPastDue: number;
  remindersSent: number;
}

const MISSING_REPORTS: MissingReport[] = [
  { id: "MR001", station: "BTM Layout CAAQMS", region: "Karnataka", type: "air", dueDate: "2026-03-09", assignedTeam: "KSPCB Team B", daysPastDue: 1, remindersSent: 1 },
  { id: "MR002", station: "Sabarmati RTWQMS", region: "Gujarat", type: "water", dueDate: "2026-03-07", assignedTeam: "GPCB Water Team", daysPastDue: 3, remindersSent: 2 },
  { id: "MR003", station: "AIIMS Hospital NMS", region: "Delhi", type: "noise", dueDate: "2026-03-06", assignedTeam: "DPCC Noise Team", daysPastDue: 4, remindersSent: 2 },
  { id: "MR004", station: "Kolkata Park Street CAAQMS", region: "West Bengal", type: "air", dueDate: "2026-03-04", assignedTeam: "WBPCB Team A", daysPastDue: 6, remindersSent: 3 },
  { id: "MR005", station: "Ganga at Kanpur RTWQMS", region: "Uttar Pradesh", type: "water", dueDate: "2026-03-02", assignedTeam: "UPPCB Water Team", daysPastDue: 8, remindersSent: 3 },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AlertType | "all">("all");
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [tab, setTab] = useState<"alerts" | "missing">("alerts");
  const [missingReports, setMissingReports] = useState(MISSING_REPORTS);

  useEffect(() => {
    async function load() {
      const [air, water] = await Promise.all([fetchMergedAirData(), generateWaterData()]);
      const noise = generateNoiseData();
      setAlerts(generateAlerts(air, water, noise));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = alerts.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === "Critical").length;
  const warningCount = alerts.filter((a) => a.severity === "Warning").length;
  const activeCount = alerts.filter((a) => a.status === "Active").length;

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" as const } : a))
    );
  };

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Resolved" as const } : a))
    );
  };

  const handleEscalate = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" as const, severity: "Critical" as const } : a))
    );
  };

  const handleSendReminder = (id: string) => {
    setMissingReports((prev) =>
      prev.map((mr) => (mr.id === id ? { ...mr, remindersSent: mr.remindersSent + 1 } : mr))
    );
  };

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
          <h1 className="text-2xl font-bold text-white">Alerts & Escalation</h1>
          <p className="text-sm text-muted">Real-time violation alerts, escalation workflow, and missing report tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("alerts")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${tab === "alerts" ? "bg-red-500/20 text-red-400" : "bg-card text-muted hover:text-white"}`}>
            <AlertTriangle size={14} /> Alerts ({alerts.length})
          </button>
          <button onClick={() => setTab("missing")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${tab === "missing" ? "bg-orange-500/20 text-orange-400" : "bg-card text-muted hover:text-white"}`}>
            <FileWarning size={14} /> Missing Reports ({missingReports.length})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="text-red-400" size={24} />
          <div>
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-muted">Critical Alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <Bell className="text-yellow-400" size={24} />
          <div>
            <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
            <p className="text-xs text-muted">Warnings</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <Clock className="text-muted" size={24} />
          <div>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
            <p className="text-xs text-muted">Active (Pending)</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <FileWarning className="text-orange-400" size={24} />
          <div>
            <p className="text-2xl font-bold text-orange-400">{missingReports.length}</p>
            <p className="text-xs text-muted">Missing Reports</p>
          </div>
        </div>
      </div>

      {tab === "alerts" ? (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Filter size={12} /> Filter:
            </div>
            {(["all", "air", "water", "noise"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${filterType === t ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <span className="mx-2 text-border">|</span>
            {(["all", "Critical", "Warning"] as const).map((s) => (
              <button key={s} onClick={() => setFilterSeverity(s)} className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${filterSeverity === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
                {s === "all" ? "All Severity" : s}
              </button>
            ))}
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-12 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-green-400" size={40} />
                <p className="text-white">No alerts matching filters</p>
              </div>
            ) : (
              filtered.map((a) => (
                <div key={a.id} className={`rounded-xl border p-4 transition-all ${severityStyles[a.severity]} ${a.status === "Resolved" ? "opacity-50" : ""}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted">{typeIcons[a.type]}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{a.title}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${severityBadge[a.severity]}`}>{a.severity}</span>
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">{a.type.toUpperCase()}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{a.description}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                          <span>📍 {a.region}</span>
                          <span>📊 {a.parameter}: {a.value} (Limit: {a.limit})</span>
                          <span>🕐 {new Date(a.timestamp).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === "Active" && (
                        <>
                          <button onClick={() => handleEscalate(a.id)} className="flex items-center gap-1 rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/30">
                            <ArrowUpRight size={12} /> Escalate
                          </button>
                          <button onClick={() => handleAcknowledge(a.id)} className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/30">Acknowledge</button>
                          <button onClick={() => handleResolve(a.id)} className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30">Resolve</button>
                        </>
                      )}
                      {a.status === "Acknowledged" && (
                        <>
                          <button onClick={() => handleEscalate(a.id)} className="flex items-center gap-1 rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/30">
                            <ArrowUpRight size={12} /> Escalate
                          </button>
                          <button onClick={() => handleResolve(a.id)} className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30">Resolve</button>
                        </>
                      )}
                      {a.status === "Resolved" && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 size={14} /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Missing Reports Tab */
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-card">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Station</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Due Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Days Overdue</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Assigned Team</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Reminders</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {missingReports.map((mr) => (
                  <tr key={mr.id} className="border-b border-border bg-background">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{mr.station}</p>
                      <p className="text-[10px] text-muted">{mr.region}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${mr.type === "air" ? "bg-yellow-500/15 text-yellow-400" : mr.type === "water" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>{mr.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{mr.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${mr.daysPastDue > 5 ? "text-red-400" : mr.daysPastDue > 2 ? "text-orange-400" : "text-yellow-400"}`}>{mr.daysPastDue} days</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{mr.assignedTeam}</td>
                    <td className="px-4 py-3 text-xs text-muted">{mr.remindersSent} sent</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSendReminder(mr.id)} className="flex items-center gap-1 rounded bg-orange-500/20 px-2 py-1 text-[10px] font-medium text-orange-400 hover:bg-orange-500/30">
                        <Send size={10} /> Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Auto-reminders are sent every 48 hours for overdue reports. Manual reminders can be sent above.</p>
        </>
      )}
    </div>
  );
}
