import { NextResponse } from "next/server";
import type { PublicComplaintPayload } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listRuntimeComplaints, saveRuntimeComplaint } from "@/lib/runtimeStore";

type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

interface ComplaintTriage {
  priority: ComplaintPriority;
  corroborationScore: number;
  sentimentScore: number;
  summary: string;
  entities: {
    state: string;
    city: string;
    category: PublicComplaintPayload["category"];
    hazardKeywords: string[];
  };
  keywordHits: string[];
}

const REQUIRED_FIELDS: Array<keyof PublicComplaintPayload> = [
  "name",
  "mobile",
  "email",
  "address",
  "state",
  "city",
  "category",
  "locationDetails",
  "observedAt",
  "description",
];

const HIGH_SEVERITY_TERMS = [
  "dead fish",
  "chemical leak",
  "toxic",
  "hazard",
  "burning",
  "thick smoke",
  "foul smell",
  "black water",
  "oil spill",
  "hospitalized",
];

const EVIDENCE_TERMS = [
  "foam",
  "ash",
  "dust",
  "effluent",
  "dumping",
  "odor",
  "noise",
  "vibration",
  "color change",
  "breathing",
  "cough",
  "children",
  "school",
  "hospital",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPayload(payload: Partial<PublicComplaintPayload>): payload is PublicComplaintPayload {
  return REQUIRED_FIELDS.every((field) => isNonEmptyString(payload[field]));
}

function normalizePayload(payload: PublicComplaintPayload): PublicComplaintPayload {
  return {
    ...payload,
    name: payload.name.trim(),
    mobile: payload.mobile.trim(),
    email: payload.email.trim().toLowerCase(),
    address: payload.address.trim(),
    state: payload.state.trim(),
    city: payload.city.trim(),
    locationDetails: payload.locationDetails.trim(),
    observedAt: payload.observedAt.trim(),
    description: payload.description.trim(),
  };
}

function buildComplaintId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PN-${date}-${suffix}`;
}

function getKeywordHits(input: string, terms: string[]): string[] {
  const lowered = input.toLowerCase();
  return terms.filter((term) => lowered.includes(term));
}

function parseObservedAt(observedAt: string): Date | null {
  const parsed = new Date(observedAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function runTriage(payload: PublicComplaintPayload): ComplaintTriage {
  const text = `${payload.description} ${payload.locationDetails}`.toLowerCase();
  const highHits = getKeywordHits(text, HIGH_SEVERITY_TERMS);
  const evidenceHits = getKeywordHits(text, EVIDENCE_TERMS);
  const observed = parseObservedAt(payload.observedAt);

  let score = 1;

  if (payload.category === "industrial_discharge" || payload.category === "waste_burning") {
    score += 2;
  } else {
    score += 1;
  }

  score += highHits.length * 2;
  score += evidenceHits.length;

  if (observed) {
    const hoursAgo = (Date.now() - observed.getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 6) {
      score += 1;
    }
  }

  const priority: ComplaintPriority =
    score >= 7 ? "Critical" : score >= 5 ? "High" : score >= 3 ? "Medium" : "Low";

  const corroborationScore = Math.min(
    1,
    0.2 + highHits.length * 0.2 + evidenceHits.length * 0.08 + (priority === "Critical" ? 0.15 : 0),
  );

  const summary =
    priority === "Critical"
      ? "Immediate field verification recommended based on hazard terms and recency."
      : priority === "High"
        ? "High-priority complaint. Recommend rapid triage with nearby sensor cross-check."
        : "Complaint registered for standard review and corroboration check.";

  return {
    priority,
    corroborationScore: Number(corroborationScore.toFixed(2)),
    sentimentScore: Number(Math.max(-1, -score * 0.12).toFixed(2)),
    summary,
    entities: {
      state: payload.state,
      city: payload.city,
      category: payload.category,
      hazardKeywords: [...new Set([...highHits, ...evidenceHits])],
    },
    keywordHits: [...new Set([...highHits, ...evidenceHits])],
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<PublicComplaintPayload>;

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "All complaint fields are required" }, { status: 400 });
    }

    const normalizedPayload = normalizePayload(payload);
    const triage = runTriage(normalizedPayload);
    const complaintId = buildComplaintId();
    const createdAt = new Date().toISOString();
    const observedAt = parseObservedAt(normalizedPayload.observedAt)?.toISOString() || createdAt;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: inserted, error } = await supabase
        .from("public_complaints")
        .insert({
          complaint_id: complaintId,
          name: normalizedPayload.name,
          mobile: normalizedPayload.mobile,
          email: normalizedPayload.email,
          address: normalizedPayload.address,
          state: normalizedPayload.state,
          city: normalizedPayload.city,
          category: normalizedPayload.category,
          location_details: normalizedPayload.locationDetails,
          observed_at: observedAt,
          description: normalizedPayload.description,
          status: "Submitted",
          triage_priority: triage.priority,
          sensor_corroboration_score: triage.corroborationScore,
          triage_summary: triage.summary,
          metadata: {
            source: "citizen_portal",
          },
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.error("Failed to store complaint in Supabase", error);
      } else {
        if (inserted?.id) {
          const { error: triageError } = await supabase.from("complaint_triage_events").insert({
            complaint_ref: inserted.id,
            model_version: "rules-v1",
            sentiment_score: triage.sentimentScore,
            extracted_entities: triage.entities,
            evidence: {
              keywordHits: triage.keywordHits,
              source: "rule_based_pretriage",
            },
            decision: triage.priority,
          });

          if (triageError) {
            console.error("Failed to store triage event", triageError);
          }
        }

        return NextResponse.json({
          complaintId,
          status: "Submitted",
          createdAt: inserted?.created_at || createdAt,
          triagePriority: triage.priority,
        });
      }
    }

    await saveRuntimeComplaint({
      id: complaintId,
      complaintId,
      name: normalizedPayload.name,
      mobile: normalizedPayload.mobile,
      email: normalizedPayload.email,
      address: normalizedPayload.address,
      state: normalizedPayload.state,
      city: normalizedPayload.city,
      category: normalizedPayload.category,
      locationDetails: normalizedPayload.locationDetails,
      observedAt,
      description: normalizedPayload.description,
      status: "Submitted",
      triagePriority: triage.priority,
      corroborationScore: triage.corroborationScore,
      triageSummary: triage.summary,
      createdAt,
      updatedAt: createdAt,
      latestTriageEvent: {
        modelVersion: "rules-v1",
        sentimentScore: triage.sentimentScore,
        decision: triage.priority,
        keywordHits: triage.keywordHits,
        createdAt,
      },
    });

    return NextResponse.json({
      complaintId,
      status: "Submitted",
      createdAt,
      triagePriority: triage.priority,
    });
  } catch {
    return NextResponse.json({ error: "Unable to submit complaint" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 50)));

  if (supabase) {
    const { data, error } = await supabase
      .from("public_complaints")
      .select("complaint_id, status, category, state, city, triage_priority, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Unable to fetch complaints from Supabase, using fallback store", error);
    } else {
      return NextResponse.json({ complaints: data || [] });
    }
  }

  const runtimeComplaints = await listRuntimeComplaints();

  return NextResponse.json({
    complaints: runtimeComplaints.slice(0, limit).map((item) => ({
      complaint_id: item.complaintId,
      status: item.status,
      category: item.category,
      state: item.state,
      city: item.city,
      triage_priority: item.triagePriority,
      created_at: item.createdAt,
    })),
  });
}