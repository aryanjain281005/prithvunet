"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Database,
  Loader2,
  MessageCircle,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface CopilotLogItem {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
  intent: string;
  region: string;
  query: string;
  responsePreview: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  createdAt: string;
}

interface SimulationSnapshot {
  scenarioId: string;
  userId: string;
  scenarioType: string;
  region: string;
  createdAt: string;
}

interface CopilotLogsPayload {
  summary: {
    totalLogs: number;
    whatIfLogs: number;
    complianceLogs: number;
    healthLogs: number;
    last24h: number;
    totalSimulations: number;
  };
  logs: CopilotLogItem[];
  simulations: SimulationSnapshot[];
  degraded: boolean;
  reason?: string;
}

interface PersistenceValidation {
  ok: boolean;
  usingServiceRole?: boolean;
  simulationPersisted?: boolean;
  reportPersisted?: boolean;
  simulationTableReady?: boolean;
  reportTableReady?: boolean;
  errors?: {
    simulation: string | null;
    report: string | null;
  };
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function intentClass(intent: string): string {
  if (intent === "what_if") return "bg-purple-500/20 text-purple-300";
  if (intent === "compliance") return "bg-orange-500/20 text-orange-300";
  if (intent === "health_risk") return "bg-red-500/20 text-red-300";
  return "bg-zinc-500/20 text-zinc-300";
}

export default function AdminCopilotLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [degradedReason, setDegradedReason] = useState("");
  const [summary, setSummary] = useState<CopilotLogsPayload["summary"]>({
    totalLogs: 0,
    whatIfLogs: 0,
    complianceLogs: 0,
    healthLogs: 0,
    last24h: 0,
    totalSimulations: 0,
  });
  const [logs, setLogs] = useState<CopilotLogItem[]>([]);
  const [simulations, setSimulations] = useState<SimulationSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [q, setQ] = useState("");
  const [intent, setIntent] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<PersistenceValidation | null>(null);

  useEffect(() => {
    let disposed = false;

    async function load() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("limit", "160");
      if (q.trim()) params.set("q", q.trim());
      if (intent) params.set("intent", intent);
      if (userIdFilter.trim()) params.set("userId", userIdFilter.trim());
      if (regionFilter.trim()) params.set("region", regionFilter.trim());

      try {
        const response = await fetch(`/api/admin/copilot-logs?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as CopilotLogsPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to fetch copilot logs");
        }

        if (disposed) return;

        setSummary(payload.summary);
        setLogs(payload.logs || []);
        setSimulations(payload.simulations || []);
        setDegradedReason(payload.degraded ? payload.reason || "Running in degraded mode." : "");

        if ((payload.logs || []).length > 0) {
          setSelectedId((current) =>
            current && payload.logs.some((item) => item.id === current)
              ? current
              : payload.logs[0].id,
          );
        } else {
          setSelectedId("");
        }
      } catch (err) {
        if (disposed) return;
        setError(err instanceof Error ? err.message : "Unable to fetch copilot logs");
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void load();
    return () => {
      disposed = true;
    };
  }, [q, intent, userIdFilter, regionFilter]);

  const selectedLog = useMemo(
    () => logs.find((item) => item.id === selectedId) || null,
    [logs, selectedId],
  );

  const recentSimulations = useMemo(
    () => simulations.slice(0, 6),
    [simulations],
  );

  const validatePersistence = async () => {
    setValidationLoading(true);
    try {
      const response = await fetch("/api/admin/persistence/validate", {
        method: "POST",
      });
      const payload = (await response.json()) as PersistenceValidation;
      setValidationResult(payload);
    } catch {
      setValidationResult({
        ok: false,
        errors: {
          simulation: "Unable to validate simulation persistence",
          report: "Unable to validate report persistence",
        },
      });
    } finally {
      setValidationLoading(false);
    }
  };

  useEffect(() => {
    let disposed = false;
    async function loadValidationStatus() {
      try {
        const response = await fetch("/api/admin/persistence/validate", { cache: "no-store" });
        const payload = (await response.json()) as PersistenceValidation;
        if (!disposed) {
          setValidationResult(payload);
        }
      } catch {
        // Ignore initial status load failures.
      }
    }

    void loadValidationStatus();

    return () => {
      disposed = true;
    };
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Copilot Audit Console</h1>
          <p className="text-sm text-muted">
            Monitor copilot prompts, intent distribution, and simulation/report persistence
          </p>
        </div>
        <button
          type="button"
          onClick={validatePersistence}
          disabled={validationLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {validationLoading ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
          Validate Persistence
        </button>
      </div>

      {validationResult && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${validationResult.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-orange-500/30 bg-orange-500/10 text-orange-200"}`}>
          <div className="flex items-center gap-2">
            {validationResult.ok ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>
              Simulation persisted: {String(Boolean(validationResult.simulationPersisted ?? validationResult.simulationTableReady))} | Report persisted: {String(Boolean(validationResult.reportPersisted ?? validationResult.reportTableReady))}
            </span>
          </div>
          <p className="mt-1 text-xs">Service-role configured: {String(Boolean(validationResult.usingServiceRole))}</p>
          {validationResult.errors?.simulation && (
            <p className="mt-1 text-xs">Simulation error: {validationResult.errors.simulation}</p>
          )}
          {validationResult.errors?.report && (
            <p className="mt-1 text-xs">Report error: {validationResult.errors.report}</p>
          )}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-white/10 bg-card p-3">
          <p className="text-lg font-bold text-white">{summary.totalLogs}</p>
          <p className="text-xs text-muted">Total Logs</p>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
          <p className="text-lg font-bold text-purple-300">{summary.whatIfLogs}</p>
          <p className="text-xs text-purple-200">What-if</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
          <p className="text-lg font-bold text-orange-300">{summary.complianceLogs}</p>
          <p className="text-xs text-orange-200">Compliance</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-lg font-bold text-red-300">{summary.healthLogs}</p>
          <p className="text-xs text-red-200">Health</p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
          <p className="text-lg font-bold text-cyan-300">{summary.last24h}</p>
          <p className="text-xs text-cyan-200">Last 24h</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-lg font-bold text-emerald-300">{summary.totalSimulations}</p>
          <p className="text-xs text-emerald-200">Simulations</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search query, response, user"
            className="w-full rounded-lg border border-white/10 bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary"
          />
        </label>

        <select
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All Intents</option>
          <option value="what_if">what_if</option>
          <option value="compliance">compliance</option>
          <option value="health_risk">health_risk</option>
          <option value="general">general</option>
        </select>

        <input
          value={userIdFilter}
          onChange={(event) => setUserIdFilter(event.target.value)}
          placeholder="Filter by user id"
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          value={regionFilter}
          onChange={(event) => setRegionFilter(event.target.value)}
          placeholder="Filter by region"
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary"
        />
        <div className="rounded-lg border border-white/10 bg-card px-3 py-2 text-xs text-zinc-400">
          Connected to simulation and report generation pipeline
        </div>
      </div>

      {degradedReason && (
        <div className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs text-orange-100">
          <strong>Degraded mode:</strong> {degradedReason}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-zinc-300">
              <Loader2 size={14} className="animate-spin" /> Loading copilot logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card px-4 py-6 text-sm text-zinc-400">
              No copilot logs found for selected filters.
            </div>
          ) : (
            logs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedId === item.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-white/10 bg-card hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Bot size={13} />
                    <span>{item.userId}</span>
                    <span>•</span>
                    <span>{item.region}</span>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${intentClass(item.intent)}`}>
                    {item.intent}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-white">{item.query}</p>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{item.responsePreview}</p>
                <p className="mt-2 text-[11px] text-zinc-500">{formatDate(item.createdAt)}</p>
              </button>
            ))
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-card p-4">
          {selectedLog ? (
            <>
              <div>
                <p className="text-xs text-zinc-400">Selected Log</p>
                <h3 className="mt-1 text-sm font-semibold text-white">{selectedLog.userId}</h3>
                <p className="text-xs text-zinc-500">{formatDate(selectedLog.createdAt)}</p>
              </div>

              <div className="rounded-lg bg-black/25 p-3 text-xs text-zinc-300">
                <p className="mb-1 text-zinc-500">Query</p>
                <p>{selectedLog.query}</p>
              </div>

              <div className="rounded-lg bg-black/25 p-3 text-xs text-zinc-300">
                <p className="mb-1 text-zinc-500">Response Preview</p>
                <p>{selectedLog.responsePreview}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-black/25 p-3">
                  <p className="text-zinc-500">Intent</p>
                  <p className="mt-1 text-white">{selectedLog.intent}</p>
                </div>
                <div className="rounded-lg bg-black/25 p-3">
                  <p className="text-zinc-500">Region</p>
                  <p className="mt-1 text-white">{selectedLog.region}</p>
                </div>
              </div>

              <div className="rounded-lg bg-black/25 p-3 text-xs text-zinc-300">
                <p className="text-zinc-500">Geo Context</p>
                <p className="mt-1">
                  {selectedLog.location.lat == null || selectedLog.location.lng == null
                    ? "No coordinates provided"
                    : `${selectedLog.location.lat.toFixed(5)}, ${selectedLog.location.lng.toFixed(5)}`}
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center text-sm text-zinc-500">
              Select a log to inspect details
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-semibold text-white">Recent Simulations</p>
            <div className="mt-2 space-y-2">
              {recentSimulations.length === 0 ? (
                <p className="text-xs text-zinc-500">No simulations captured yet</p>
              ) : (
                recentSimulations.map((item) => (
                  <div key={item.scenarioId} className="rounded bg-black/20 px-2 py-2 text-xs text-zinc-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{item.scenarioType}</span>
                      <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-zinc-400">
                      <Sparkles size={11} /> {item.scenarioId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
            <p className="mb-1 text-zinc-500">Pipeline Health</p>
            <p className="flex items-center gap-1">
              <MessageCircle size={12} /> Copilot logs to simulation to report generation
            </p>
            <p className="mt-1 flex items-center gap-1">
              {validationResult?.ok ? <CheckCircle2 size={12} className="text-emerald-300" /> : <ShieldAlert size={12} className="text-orange-300" />}
              {validationResult?.ok ? "Persistence validated" : "Persistence requires attention"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
