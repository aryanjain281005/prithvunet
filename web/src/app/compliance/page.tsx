"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, ShieldAlert } from "lucide-react";
import { applyComplianceCaseAction, buildRiskRows, getComplianceCases, getMissingReportReminders, getRepositoryState, seedIndustryDemoData } from "@/lib/industryCompliance";
import { useAuth } from "@/lib/auth";

export default function CompliancePage() {
  const { user, role } = useAuth();
  const [repository] = useState(() => {
    seedIndustryDemoData();
    return getRepositoryState();
  });
  const [caseRefreshKey, setCaseRefreshKey] = useState(0);

  const riskRows = buildRiskRows();
  const reminders = getMissingReportReminders();
  const cases = getComplianceCases();
  const canManageCases = role === "regional_officer" || role === "super_admin";

  const totalAlerts = repository.alerts.length;
  const missingReports = reminders.length;
  const repeatOffenders = riskRows.filter((r) => r.repeatOffender).length;
  const highRiskRegions = new Set(riskRows.filter((r) => r.regionalRisk === "High").map((r) => r.location)).size;

  const escalationLabel: Record<1 | 2 | 3 | 4, string> = {
    1: "Alert to Regional Officer",
    2: "Warning notice to Industry",
    3: "Inspection request to Monitoring Team",
    4: "Escalation to State Pollution Control Board",
  };

  const handleCaseAction = (caseId: string, action: "issue_warning" | "schedule_inspection" | "close_case") => {
    if (!canManageCases || !user) {
      return;
    }

    applyComplianceCaseAction({
      caseId,
      action,
      actor: user.name,
    });

    setCaseRefreshKey((value) => value + 1);
  };

  const visibleCases = caseRefreshKey >= 0 ? getComplianceCases() : cases;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Non-Compliance Tracking Dashboard</h1>
        <p className="text-sm text-muted">Automatic limit check, missing report reminders, repeat offenders, and escalation workflow</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            <p className="text-2xl font-bold text-red-400">{totalAlerts}</p>
          </div>
          <p className="text-xs text-muted">Violation Alerts</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">{missingReports}</p>
          </div>
          <p className="text-xs text-muted">Missing Reports</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-yellow-400" />
            <p className="text-2xl font-bold text-white">{repeatOffenders}</p>
          </div>
          <p className="text-xs text-muted">Repeat Offenders</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <p className="text-2xl font-bold text-green-400">{highRiskRegions}</p>
          </div>
          <p className="text-xs text-muted">High-Risk Regions</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-card">
                <tr>
                  <th className="px-4 py-3 text-xs text-muted">Industry</th>
                  <th className="px-4 py-3 text-xs text-muted">Violations</th>
                  <th className="px-4 py-3 text-xs text-muted">Last Report</th>
                  <th className="px-4 py-3 text-xs text-muted">Status</th>
                  <th className="px-4 py-3 text-xs text-muted">Escalation</th>
                </tr>
              </thead>
              <tbody>
                {riskRows.map((row) => (
                  <tr key={row.industryId} className="border-b border-border bg-background">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-white">{row.location}</p>
                      <p className="text-[10px] text-muted">{row.industryId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{row.violations}</td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(row.lastReport).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.status === "Compliant" ? "bg-green-500/20 text-green-400" : row.status === "High Risk" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-zinc-300">Level {row.escalationLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {riskRows.length === 0 && <p className="p-4 text-xs text-muted">No compliance records yet. Submit industry reports first.</p>}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-white">Escalation Workflow</p>
            <div className="mt-3 space-y-2">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-200">L{level}</span>
                  <span className="text-zinc-300">{escalationLabel[level as 1 | 2 | 3 | 4]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-white">Formal Compliance Cases</p>
            <div className="mt-3 space-y-2">
              {visibleCases.map((item) => (
                <div key={item.caseId} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-white">{item.caseId} • {item.location}</p>
                      <p className="mt-1 text-[11px] text-zinc-300">Assigned to {item.assignedTo} • RO</p>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.status === "Notice Issued" ? "bg-red-500/20 text-red-400" : item.status === "Closed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-300">{item.summary}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">Created by {item.createdBy} • Level {item.escalationLevel}</p>

                  {canManageCases && item.status !== "Closed" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => handleCaseAction(item.caseId, "issue_warning")} className="rounded-lg bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/30">
                        Issue Warning
                      </button>
                      <button onClick={() => handleCaseAction(item.caseId, "schedule_inspection")} className="rounded-lg bg-yellow-500/20 px-2.5 py-1 text-[11px] font-medium text-yellow-300 hover:bg-yellow-500/30">
                        Schedule Inspection
                      </button>
                      <button onClick={() => handleCaseAction(item.caseId, "close_case")} className="rounded-lg bg-green-500/20 px-2.5 py-1 text-[11px] font-medium text-green-400 hover:bg-green-500/30">
                        Close Case
                      </button>
                    </div>
                  )}

                  <div className="mt-3 rounded-md bg-white/[0.03] p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Case History</p>
                    <div className="mt-2 space-y-1.5">
                      {item.history.map((entry) => (
                        <div key={`${entry.at}-${entry.action}`} className="text-[11px] text-zinc-300">
                          <span className="text-zinc-500">{new Date(entry.at).toLocaleString("en-IN")}</span>
                          <span className="mx-1.5 text-zinc-600">•</span>
                          <span>{entry.action}</span>
                          <span className="mx-1.5 text-zinc-600">•</span>
                          <span className="text-zinc-400">{entry.by}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {visibleCases.length === 0 && <p className="text-xs text-muted">No formal cases created yet. Monitoring Team can escalate from the review desk.</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 text-sm font-semibold text-white">Missing Report Reminder Workflow</h3>
            <p className="text-xs text-muted">Day 1 due date, Day 2 email, Day 3 SMS + dashboard, Day 7 non-compliance</p>

            <div className="mt-3 space-y-2">
              {reminders.map((r) => (
                <div key={`${r.industryId}-${r.daysSinceDue}`} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium text-white">{r.location}</p>
                  <p className="mt-1 text-[11px] text-zinc-300">{r.industryId} • {r.daysSinceDue} day(s) since due</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-yellow-300"><Clock size={12} /> {r.action}</div>
                </div>
              ))}
              {reminders.length === 0 && (
                <p className="text-xs text-green-300">No pending reminders. All monitored industries are within reporting windows.</p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <div className="mb-1 flex items-center gap-2"><AlertTriangle size={12} /> Automatic limit check enabled</div>
              <p>Any pollutant above prescribed limits is auto-flagged and added to the violation repository.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-white">Recent Violation Alerts</h3>
            <div className="mt-3 space-y-2">
              {repository.alerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="rounded-lg bg-background px-3 py-2 text-xs">
                  <p className="font-medium text-white">{alert.location} • {alert.parameter}</p>
                  <p className="mt-0.5 text-zinc-300">{alert.value} {alert.unit} vs limit {alert.limit} {alert.unit}</p>
                </div>
              ))}
              {repository.alerts.length === 0 && (
                <p className="text-xs text-muted">No alerts yet. Submit reports to run automatic checks.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
