"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";

interface ComplaintTriageEvent {
  modelVersion: string;
  sentimentScore: number | null;
  decision: string;
  keywordHits: string[];
  createdAt: string;
}

interface ComplaintItem {
  id: string;
  complaintId: string;
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  state: string;
  city: string;
  category: string;
  locationDetails?: string;
  observedAt?: string;
  description: string;
  status: string;
  triagePriority: string;
  corroborationScore: number | null;
  triageSummary: string;
  createdAt: string;
  latestTriageEvent: ComplaintTriageEvent | null;
}

interface ComplaintSummary {
  total: number;
  critical: number;
  high: number;
  pending: number;
  verified: number;
}

interface ComplaintApiResponse {
  summary: ComplaintSummary;
  complaints: ComplaintItem[];
  degraded?: boolean;
  reason?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityClass(priority: string): string {
  if (priority === "Critical") return "bg-red-500/20 text-red-300";
  if (priority === "High") return "bg-orange-500/20 text-orange-300";
  if (priority === "Medium") return "bg-yellow-500/20 text-yellow-300";
  return "bg-emerald-500/20 text-emerald-300";
}

function statusClass(status: string): string {
  if (status === "Verified" || status === "Resolved") return "bg-emerald-500/20 text-emerald-300";
  if (status === "Action Initiated" || status === "Under Review") return "bg-blue-500/20 text-blue-300";
  if (status === "Rejected") return "bg-zinc-500/20 text-zinc-300";
  return "bg-amber-500/20 text-amber-300";
}

export default function AdminComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [degradedReason, setDegradedReason] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [summary, setSummary] = useState<ComplaintSummary>({
    total: 0,
    critical: 0,
    high: 0,
    pending: 0,
    verified: 0,
  });
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let disposed = false;

    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("limit", "120");
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (stateFilter) params.set("state", stateFilter);
      if (category) params.set("category", category);

      try {
        const response = await fetch(`/api/admin/complaints?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ComplaintApiResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load complaints");
        }

        if (disposed) return;

        setSummary(payload.summary);
        setComplaints(payload.complaints || []);
        setDegradedReason(payload.degraded ? payload.reason || "Running in degraded mode." : "");

        if ((payload.complaints || []).length > 0) {
          setSelectedId((current) =>
            current && payload.complaints.some((item) => item.id === current)
              ? current
              : payload.complaints[0].id,
          );
        } else {
          setSelectedId("");
        }
      } catch (err) {
        if (disposed) return;
        setError(err instanceof Error ? err.message : "Unable to load complaints");
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void load();

    return () => {
      disposed = true;
    };
  }, [q, status, priority, stateFilter, category, refreshTick]);

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.id === selectedId) || null,
    [complaints, selectedId],
  );

  const stateOptions = useMemo(
    () => Array.from(new Set(complaints.map((item) => item.state))).sort((a, b) => a.localeCompare(b)),
    [complaints],
  );

  const updateComplaintStatus = async (nextStatus: string) => {
    if (!selectedComplaint) {
      return;
    }

    setActionLoading(nextStatus);
    setError("");

    try {
      const response = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedComplaint.id, status: nextStatus }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update complaint status");
      }

      setRefreshTick((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update complaint status");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Complaint Triage Console</h1>
          <p className="text-sm text-muted">
            Live queue of public complaints with AI corroboration and triage events
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
          Source: Supabase + AI triage events
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-lg font-bold text-white">{summary.total}</p>
          <p className="text-xs text-muted">Total</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-lg font-bold text-red-300">{summary.critical}</p>
          <p className="text-xs text-red-200">Critical</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
          <p className="text-lg font-bold text-orange-300">{summary.high}</p>
          <p className="text-xs text-orange-200">High</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-lg font-bold text-amber-300">{summary.pending}</p>
          <p className="text-xs text-amber-200">Pending</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-lg font-bold text-emerald-300">{summary.verified}</p>
          <p className="text-xs text-emerald-200">Verified</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative block lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search complaint id, city, description"
            className="w-full rounded-lg border border-white/10 bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Verified">Verified</option>
          <option value="Action Initiated">Action Initiated</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-xs text-zinc-400">
          <Filter size={13} /> Filter queue
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value)}
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All States</option>
          {stateOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          <option value="air">air</option>
          <option value="water">water</option>
          <option value="noise">noise</option>
          <option value="industrial_discharge">industrial_discharge</option>
          <option value="waste_burning">waste_burning</option>
          <option value="other">other</option>
        </select>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-zinc-300">
              <Loader2 size={14} className="animate-spin" /> Loading complaint triage queue...
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card px-4 py-6 text-sm text-zinc-400">
              No complaints found for selected filters.
            </div>
          ) : (
            complaints.map((item) => (
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.complaintId}</p>
                    <p className="text-xs text-zinc-400">
                      {item.city}, {item.state} • {item.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${priorityClass(item.triagePriority)}`}>
                      {item.triagePriority}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{item.description || "No description available."}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Score: {item.corroborationScore == null ? "--" : item.corroborationScore.toFixed(2)}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-4">
          {!selectedComplaint ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center text-sm text-zinc-500">
              Select a complaint to inspect triage details
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedComplaint.complaintId}</h3>
                <p className="text-xs text-zinc-400">
                  {selectedComplaint.city}, {selectedComplaint.state} • {selectedComplaint.category}
                </p>
              </div>

              <div className="rounded-lg bg-black/25 p-3 text-xs text-zinc-300">
                <p className="text-zinc-500">AI Triage Summary</p>
                <p className="mt-1">{selectedComplaint.triageSummary || "No triage summary available."}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-black/25 p-3">
                  <p className="text-zinc-500">Priority</p>
                  <p className="mt-1 font-semibold text-white">{selectedComplaint.triagePriority}</p>
                </div>
                <div className="rounded-lg bg-black/25 p-3">
                  <p className="text-zinc-500">Corroboration</p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedComplaint.corroborationScore == null
                      ? "--"
                      : selectedComplaint.corroborationScore.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedComplaint.latestTriageEvent ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
                  <p className="font-semibold text-white">Latest AI Event</p>
                  <p className="mt-1 text-zinc-400">
                    Model: {selectedComplaint.latestTriageEvent.modelVersion} • Decision: {selectedComplaint.latestTriageEvent.decision}
                  </p>
                  <p className="mt-1 text-zinc-400">
                    Sentiment: {selectedComplaint.latestTriageEvent.sentimentScore == null
                      ? "--"
                      : selectedComplaint.latestTriageEvent.sentimentScore}
                  </p>
                  <p className="mt-2 text-zinc-400">Keywords</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedComplaint.latestTriageEvent.keywordHits.length === 0 ? (
                      <span className="rounded bg-zinc-700/40 px-2 py-0.5 text-[11px] text-zinc-300">No keyword hits</span>
                    ) : (
                      selectedComplaint.latestTriageEvent.keywordHits.map((keyword) => (
                        <span key={keyword} className="rounded bg-zinc-700/40 px-2 py-0.5 text-[11px] text-zinc-300">
                          {keyword}
                        </span>
                      ))
                    )}
                  </div>
                  <p className="mt-2 text-zinc-500">{formatDate(selectedComplaint.latestTriageEvent.createdAt)}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                  No triage event records available for this complaint.
                </div>
              )}

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={13} className="text-orange-300" />
                  <span>Status: {selectedComplaint.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Siren size={13} className="text-red-300" />
                  <span>Observed: {formatDate(selectedComplaint.observedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedComplaint.status === "Verified" ? (
                    <ShieldCheck size={13} className="text-emerald-300" />
                  ) : (
                    <AlertTriangle size={13} className="text-amber-300" />
                  )}
                  <span>Created: {formatDate(selectedComplaint.createdAt)}</span>
                </div>
                <div className="rounded-lg bg-black/25 p-2 text-zinc-300">
                  {selectedComplaint.description || "No description provided"}
                </div>
              </div>

              {(selectedComplaint.name || selectedComplaint.mobile || selectedComplaint.email) && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
                  <p className="font-semibold text-white">Reporter Contact</p>
                  <p className="mt-1">Name: {selectedComplaint.name || "--"}</p>
                  <p>Mobile: {selectedComplaint.mobile || "--"}</p>
                  <p>Email: {selectedComplaint.email || "--"}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[
                  "Under Review",
                  "Verified",
                  "Action Initiated",
                  "Resolved",
                ].map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    onClick={() => updateComplaintStatus(nextStatus)}
                    disabled={actionLoading === nextStatus || selectedComplaint.status === nextStatus}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {actionLoading === nextStatus ? "Updating..." : nextStatus}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
