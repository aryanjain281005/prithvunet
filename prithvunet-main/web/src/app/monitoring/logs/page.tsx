"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Clock3, FileWarning, Search, ShieldAlert } from "lucide-react";
import {
  getMonitoringReviews,
  getRepositoryState,
  markMonitoringReview,
  MonitoringReviewStatus,
  seedIndustryDemoData,
} from "@/lib/industryCompliance";
import { useAuth } from "@/lib/auth";

const reviewColor: Record<MonitoringReviewStatus, string> = {
  "Pending Review": "bg-blue-500/20 text-blue-400",
  Verified: "bg-green-500/20 text-green-400",
  "Recheck Required": "bg-yellow-500/20 text-yellow-400",
  Escalated: "bg-red-500/20 text-red-400",
};

export default function LogsPage() {
  const { user, role } = useAuth();
  const [search, setSearch] = useState("");

  const [state, setState] = useState(() => {
    seedIndustryDemoData();
    return {
      repo: getRepositoryState(),
      reviews: getMonitoringReviews(),
    };
  });

  const records = useMemo(() => {
    return state.repo.submissions
      .map((submission) => ({
        submission,
        review: state.reviews[submission.id],
      }))
      .filter(({ submission }) => {
        if (!search.trim()) {
          return true;
        }
        const q = search.toLowerCase();
        return (
          submission.industryId.toLowerCase().includes(q) ||
          submission.location.toLowerCase().includes(q) ||
          submission.region.toLowerCase().includes(q)
        );
      });
  }, [state, search]);

  const pendingCount = records.filter((r) => !r.review || r.review.status === "Pending Review").length;
  const escalatedCount = records.filter((r) => r.review?.status === "Escalated").length;
  const recheckCount = records.filter((r) => r.review?.status === "Recheck Required").length;

  const canReview = role === "monitoring_team" || role === "regional_officer" || role === "super_admin";

  const applyReview = (reportId: string, status: MonitoringReviewStatus) => {
    if (!canReview || !user) {
      return;
    }

    markMonitoringReview({
      reportId,
      status,
      reviewer: user.name,
    });

    setState({
      repo: getRepositoryState(),
      reviews: getMonitoringReviews(),
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Monitoring Team Review Desk</h1>
        <p className="text-sm text-muted">
          Monitoring Team reviews industry submissions, marks verification outcomes, and escalates suspicious/non-compliant reports.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-white">{records.length}</p>
          <p className="text-xs text-muted">Total Submitted Reports</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2"><Clock3 size={15} className="text-blue-400" /><p className="text-2xl font-bold text-blue-400">{pendingCount}</p></div>
          <p className="text-xs text-muted">Pending Review</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2"><FileWarning size={15} className="text-yellow-400" /><p className="text-2xl font-bold text-yellow-400">{recheckCount}</p></div>
          <p className="text-xs text-muted">Recheck Required</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2"><ShieldAlert size={15} className="text-red-400" /><p className="text-2xl font-bold text-red-400">{escalatedCount}</p></div>
          <p className="text-xs text-muted">Escalated Cases</p>
        </div>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input
          type="text"
          placeholder="Search industry, location, region"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        {records.map(({ submission, review }) => {
          const current: MonitoringReviewStatus = review?.status || "Pending Review";
          return (
            <div key={submission.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{submission.industryId} • {submission.location}</p>
                  <p className="text-[11px] text-muted">
                    {submission.region} • {new Date(submission.timestamp).toLocaleString("en-IN")} • Violations: {submission.violationCount}
                  </p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${reviewColor[current]}`}>{current}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
                <span className="rounded bg-white/5 px-2 py-0.5">Air: {submission.airPollutants.map((p) => `${p.name} ${p.value}`).join(", ")}</span>
                <span className="rounded bg-white/5 px-2 py-0.5">Water: {submission.waterPollutants.map((p) => `${p.name} ${p.value}`).join(", ")}</span>
                <span className="rounded bg-white/5 px-2 py-0.5">Noise: {submission.noiseLevelDb} dB</span>
              </div>

              {canReview && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => applyReview(submission.id, "Verified")} className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30">Mark Verified</button>
                  <button onClick={() => applyReview(submission.id, "Recheck Required")} className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/30">Mark Recheck</button>
                  <button onClick={() => applyReview(submission.id, "Escalated")} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30">Escalate</button>
                </div>
              )}

              {review && (
                <div className="mt-3 text-[11px] text-zinc-400">
                  Reviewed by {review.reviewer} on {new Date(review.reviewedAt).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {records.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <ClipboardCheck size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">No submitted reports available for review.</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-zinc-300">
        <p className="font-semibold text-white">Monitoring Team Responsibility</p>
        <div className="mt-2 space-y-1">
          <p>1. Review industry self-reported emissions and compare expected limits.</p>
          <p>2. Mark verified reports after field or instrument validation.</p>
          <p>3. Mark recheck-required where discrepancies appear.</p>
          <p>4. Escalate high-risk submissions to Regional Officer/authority workflow.</p>
        </div>
      </div>
    </div>
  );
}
