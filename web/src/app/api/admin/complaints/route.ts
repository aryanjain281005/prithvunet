import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRequestSession } from "@/lib/serverSession";
import { listRuntimeComplaints, updateRuntimeComplaintStatus } from "@/lib/runtimeStore";
import type { UserRole } from "@/lib/types";

type AllowedRole = Extract<UserRole, "super_admin" | "regional_officer">;

interface ComplaintRow {
  id: string;
  complaint_id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  city: string;
  category: string;
  location_details: string;
  observed_at: string;
  description: string;
  status: string;
  triage_priority: string;
  sensor_corroboration_score: number;
  triage_summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface TriageRow {
  complaint_ref: string;
  model_version: string;
  sentiment_score: number | null;
  decision: string;
  extracted_entities: Record<string, unknown>;
  evidence: Record<string, unknown>;
  created_at: string;
}

const VALID_STATUSES = [
  "Submitted",
  "Under Review",
  "Verified",
  "Action Initiated",
  "Resolved",
  "Rejected",
] as const;

function matchesRegion(state: string, region: string | undefined): boolean {
  if (!region) {
    return true;
  }
  return state.trim().toLowerCase() === region.trim().toLowerCase();
}

function matchesComplaintFilters(
  item: {
    complaintId: string;
    name?: string;
    email?: string;
    city: string;
    state: string;
    description: string;
    status: string;
    triagePriority: string;
    category: string;
  },
  filters: {
    q: string;
    status: string;
    priority: string;
    state: string;
    category: string;
    region?: string;
  },
): boolean {
  if (filters.status && item.status !== filters.status) {
    return false;
  }
  if (filters.priority && item.triagePriority !== filters.priority) {
    return false;
  }
  if (filters.category && item.category !== filters.category) {
    return false;
  }
  if (filters.state && item.state.toLowerCase() !== filters.state.toLowerCase()) {
    return false;
  }
  if (!matchesRegion(item.state, filters.region)) {
    return false;
  }
  if (!filters.q) {
    return true;
  }

  const haystack = [item.complaintId, item.name, item.email, item.city, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(filters.q.toLowerCase());
}

function buildSummary(
  complaints: Array<{ triagePriority: string; status: string }>,
): { total: number; critical: number; high: number; pending: number; verified: number } {
  return {
    total: complaints.length,
    critical: complaints.filter((item) => item.triagePriority === "Critical").length,
    high: complaints.filter((item) => item.triagePriority === "High").length,
    pending: complaints.filter((item) => item.status === "Submitted").length,
    verified: complaints.filter((item) => item.status === "Verified").length,
  };
}

function canAccess(role: UserRole | undefined): role is AllowedRole {
  return role === "super_admin" || role === "regional_officer";
}

function parseLimit(rawLimit: string | null): number {
  const parsed = Number(rawLimit || 50);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.max(1, Math.min(200, Math.round(parsed)));
}

function toArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string") as string[];
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession();
  if (!session || !canAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const state = searchParams.get("state") || "";
  const category = searchParams.get("category") || "";
  const q = (searchParams.get("q") || "").trim();

  const filters = {
    q,
    status,
    priority,
    state,
    category,
    region: session.role === "regional_officer" ? session.region : undefined,
  };

  if (!supabase) {
    const runtimeComplaints = (await listRuntimeComplaints())
      .filter((item) => matchesComplaintFilters(item, filters))
      .slice(0, limit);

    return NextResponse.json({
      summary: buildSummary(runtimeComplaints),
      complaints: runtimeComplaints,
      degraded: true,
      reason: "Supabase server client is not configured; using runtime complaint store.",
    });
  }

  let query = supabase
    .from("public_complaints")
    .select(
      "id, complaint_id, name, mobile, email, address, state, city, category, location_details, observed_at, description, status, triage_priority, sensor_corroboration_score, triage_summary, metadata, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (priority) {
    query = query.eq("triage_priority", priority);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (state) {
    query = query.ilike("state", state);
  }

  if (session.role === "regional_officer" && session.region) {
    query = query.ilike("state", session.region);
  }

  if (q) {
    const safeQuery = q.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    query = query.or(
      `complaint_id.ilike.%${safeQuery}%,name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`,
    );
  }

  const { data: complaints, error } = await query;
  if (error) {
    const origin = new URL(request.url).origin;
    const fallbackRes = await fetch(`${origin}/api/public/complaints?limit=${limit}`, {
      cache: "no-store",
    }).catch(() => null);

    if (!fallbackRes || !fallbackRes.ok) {
      return NextResponse.json({ error: "Unable to fetch complaints" }, { status: 500 });
    }

    const fallbackPayload = (await fallbackRes.json()) as {
      complaints?: Array<{
        complaint_id: string;
        status: string;
        category: string;
        state: string;
        city: string;
        triage_priority: string;
        created_at: string;
      }>;
    };

    const runtimeComplaints = (await listRuntimeComplaints())
      .filter((item) => matchesComplaintFilters(item, filters))
      .slice(0, limit);

    const fallbackComplaints = runtimeComplaints.length > 0
      ? runtimeComplaints
      : (fallbackPayload.complaints || []).map((item) => ({
          id: item.complaint_id,
          complaintId: item.complaint_id,
          state: item.state,
          city: item.city,
          category: item.category,
          status: item.status,
          triagePriority: item.triage_priority,
          corroborationScore: null,
          triageSummary: "Fallback mode: apply AI extension SQL to enable full triage metadata.",
          description: "",
          createdAt: item.created_at,
          updatedAt: item.created_at,
          latestTriageEvent: null,
        }));

    return NextResponse.json({
      summary: buildSummary(fallbackComplaints),
      complaints: fallbackComplaints,
      degraded: true,
      reason: "AI complaint tables are not yet available.",
    });
  }

  const typedComplaints = (complaints || []) as ComplaintRow[];
  const complaintIds = typedComplaints.map((item) => item.id);

  let triageByComplaint = new Map<string, TriageRow>();
  if (complaintIds.length > 0) {
    const { data: triageRows } = await supabase
      .from("complaint_triage_events")
      .select("complaint_ref, model_version, sentiment_score, decision, extracted_entities, evidence, created_at")
      .in("complaint_ref", complaintIds)
      .order("created_at", { ascending: false });

    for (const row of (triageRows || []) as TriageRow[]) {
      if (!triageByComplaint.has(row.complaint_ref)) {
        triageByComplaint.set(row.complaint_ref, row);
      }
    }
  }

  const result = typedComplaints.map((item) => {
    const latest = triageByComplaint.get(item.id) || null;
    const evidence = latest?.evidence || {};
    const keywordHits = toArrayOfStrings((evidence as Record<string, unknown>).keywordHits);

    return {
      id: item.id,
      complaintId: item.complaint_id,
      name: item.name,
      mobile: item.mobile,
      email: item.email,
      address: item.address,
      state: item.state,
      city: item.city,
      category: item.category,
      locationDetails: item.location_details,
      observedAt: item.observed_at,
      description: item.description,
      status: item.status,
      triagePriority: item.triage_priority,
      corroborationScore: item.sensor_corroboration_score,
      triageSummary: item.triage_summary,
      metadata: item.metadata || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      latestTriageEvent: latest
        ? {
            modelVersion: latest.model_version,
            sentimentScore: latest.sentiment_score,
            decision: latest.decision,
            keywordHits,
            createdAt: latest.created_at,
          }
        : null,
    };
  });

  const summary = buildSummary(result);

  return NextResponse.json({ summary, complaints: result, degraded: false });
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession();
  if (!session || !canAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; complaintId?: string; status?: string }
    | null;

  const complaintRef = body?.id || body?.complaintId || "";
  const nextStatus = body?.status || "";

  if (!complaintRef || !VALID_STATUSES.includes(nextStatus as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Valid complaint id and status are required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from("public_complaints")
      .select("id, complaint_id, state")
      .or(`id.eq.${complaintRef},complaint_id.eq.${complaintRef}`)
      .maybeSingle();

    if (!existingError && existing) {
      if (session.role === "regional_officer" && !matchesRegion(existing.state as string, session.region)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: updated, error: updateError } = await supabase
        .from("public_complaints")
        .update({ status: nextStatus })
        .eq("id", existing.id)
        .select("id, complaint_id, status, updated_at")
        .single();

      if (!updateError && updated) {
        return NextResponse.json({
          ok: true,
          complaintId: updated.complaint_id,
          status: updated.status,
          updatedAt: updated.updated_at,
          degraded: false,
        });
      }
    }
  }

  const runtimeComplaints = await listRuntimeComplaints();
  const runtimeExisting = runtimeComplaints.find(
    (item) => item.id === complaintRef || item.complaintId === complaintRef,
  );
  if (!runtimeExisting) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  if (session.role === "regional_officer" && !matchesRegion(runtimeExisting.state, session.region)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatedRuntime = await updateRuntimeComplaintStatus(complaintRef, nextStatus);
  if (!updatedRuntime) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    complaintId: updatedRuntime.complaintId,
    status: updatedRuntime.status,
    updatedAt: updatedRuntime.updatedAt,
    degraded: true,
  });
}
