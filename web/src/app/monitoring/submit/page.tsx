"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Factory, Send } from "lucide-react";
import {
  buildAirReadings,
  buildRiskRows,
  buildWaterReadings,
  getRepositoryState,
  MonitoringSource,
  REPORT_KIND_LABELS,
  ReportKind,
  seedIndustryDemoData,
  SOURCE_LABELS,
  submitIndustryReport,
} from "@/lib/industryCompliance";

export default function SubmitPage() {
  const [industryId, setIndustryId] = useState("IND-102");
  const [location, setLocation] = useState("Gujarat Steel Plant");
  const [region, setRegion] = useState("Gujarat");
  const [submittedBy, setSubmittedBy] = useState("Vikram Singh");
  const [reportKind, setReportKind] = useState<ReportKind>("monthly_compliance");
  const [monitoringSource, setMonitoringSource] = useState<MonitoringSource>("self_report");
  const [so2, setSo2] = useState("120");
  const [nox, setNox] = useState("88");
  const [pm25, setPm25] = useState("76");
  const [ph, setPh] = useState("8.1");
  const [bod, setBod] = useState("26");
  const [cod, setCod] = useState("210");
  const [noiseDb, setNoiseDb] = useState("78");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [lastViolationCount, setLastViolationCount] = useState<number | null>(null);
  const [repository, setRepository] = useState(() => {
    seedIndustryDemoData();
    return getRepositoryState();
  });
  const latestReports = repository.submissions.slice(0, 8);
  const topRisk = buildRiskRows().slice(0, 3);

  const handleSubmit = () => {
    setSubmitting(true);
    setMessage("");

    const report = submitIndustryReport({
      industryId,
      location,
      region,
      reportKind,
      monitoringSource,
      submittedBy,
      airPollutants: buildAirReadings({
        so2: Number(so2),
        nox: Number(nox),
        pm25: Number(pm25),
      }),
      waterPollutants: buildWaterReadings({
        ph: Number(ph),
        bod: Number(bod),
        cod: Number(cod),
      }),
      noiseLevelDb: Number(noiseDb),
      noiseLimitDb: 75,
    });

    setLastViolationCount(report.violationCount);
    setMessage(`Report ${report.id} submitted to Environmental Data Repository.`);
    setSubmitting(false);
    setRepository(getRepositoryState());
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Industry Pollution Report Submission</h1>
        <p className="text-sm text-muted">Industry users submit daily, monthly, and special monitoring reports for compliance checks</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs text-muted">Industry ID</span>
                <input value={industryId} onChange={(e) => setIndustryId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-muted">Location</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-muted">Region</span>
                <input value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-muted">Submitted By</span>
                <input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
              </label>
            </div>

            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs text-muted">Report Type</span>
                <select value={reportKind} onChange={(e) => setReportKind(e.target.value as ReportKind)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none">
                  {Object.entries(REPORT_KIND_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-muted">Monitoring Source</span>
                <select value={monitoringSource} onChange={(e) => setMonitoringSource(e.target.value as MonitoringSource)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none">
                  {Object.entries(SOURCE_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Air Pollutants</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label><span className="mb-1.5 block text-xs text-muted">SO2 (limit 80)</span><input type="number" value={so2} onChange={(e) => setSo2(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
                <label><span className="mb-1.5 block text-xs text-muted">NOx (limit 80)</span><input type="number" value={nox} onChange={(e) => setNox(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
                <label><span className="mb-1.5 block text-xs text-muted">PM2.5 (limit 60)</span><input type="number" value={pm25} onChange={(e) => setPm25(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Water Pollutants</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label><span className="mb-1.5 block text-xs text-muted">pH (6.5 to 8.5)</span><input type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
                <label><span className="mb-1.5 block text-xs text-muted">BOD (limit 30)</span><input type="number" value={bod} onChange={(e) => setBod(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
                <label><span className="mb-1.5 block text-xs text-muted">COD (limit 250)</span><input type="number" value={cod} onChange={(e) => setCod(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="mb-2 text-sm font-semibold text-white">Noise Level</h3>
              <label><span className="mb-1.5 block text-xs text-muted">dB (limit 75)</span><input type="number" value={noiseDb} onChange={(e) => setNoiseDb(e.target.value)} className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" /></label>
            </div>

            {message && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                <div className="flex items-center gap-2"><CheckCircle2 size={14} /> {message}</div>
                {lastViolationCount !== null && (
                  <p className="mt-1 text-xs text-zinc-200">
                    Auto-limit check complete: {lastViolationCount} violation(s) detected and pushed to compliance alerts.
                  </p>
                )}
              </div>
            )}

            <button disabled={submitting} onClick={handleSubmit} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60">
              <Send size={14} /> Submit Data
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList size={16} className="text-primary" /> Environmental Data Repository
            </h3>
            <div className="space-y-3">
              {latestReports.map((s) => {
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Factory size={14} className="text-muted" />
                        <div>
                          <p className="text-xs font-medium text-white">{s.industryId} • {s.location}</p>
                          <p className="text-[10px] text-muted">{s.submittedBy} • {new Date(s.timestamp).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.violationCount > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {s.violationCount > 0 ? "Violation" : "Compliant"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                      <span className="rounded bg-white/5 px-1.5 py-0.5">{REPORT_KIND_LABELS[s.reportKind]}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5">Source: {SOURCE_LABELS[s.monitoringSource]}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5">Alerts: {s.violationCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold text-white">Top Risk Snapshot</p>
              <div className="mt-2 space-y-2">
                {topRisk.map((r) => (
                  <div key={r.industryId} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{r.location}</span>
                    <span className={r.status === "Compliant" ? "text-green-400" : r.status === "High Risk" ? "text-yellow-400" : "text-red-400"}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {topRisk.length === 0 && <p className="text-xs text-muted">No report data yet.</p>}
              </div>
            </div>

            {lastViolationCount !== null && lastViolationCount > 0 && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <div className="mb-1 flex items-center gap-2"><AlertTriangle size={12} /> Alert generated and Regional Officer notified.</div>
                <p>Violation entries are available in the compliance dashboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
