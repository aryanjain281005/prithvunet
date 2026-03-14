import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRequestSession } from "@/lib/serverSession";
import { listRuntimeCopilotLogs, listRuntimeSimulations } from "@/lib/runtimeStore";
import type { UserRole } from "@/lib/types";

type AllowedRole = Extract<UserRole, "super_admin" | "regional_officer">;

interface CopilotLogRow {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  query: string;
  response: string;
  intent: string;
  region?: string;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

interface RuntimeLogItem {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
  intent: string;
  region: string;
  query: string;
  response: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  createdAt: string;
}

function canAccess(role: UserRole | undefined): role is AllowedRole {
  return role === "super_admin" || role === "regional_officer";
}

function parseLimit(rawLimit: string | null): number {
  const parsed = Number(rawLimit || 100);
  if (!Number.isFinite(parsed)) {
    return 100;
  }
  return Math.max(1, Math.min(300, Math.round(parsed)));
}

function matchesRegion(region: string, scopedRegion: string | undefined): boolean {
  if (!scopedRegion) {
    return true;
  }
  return region.trim().toLowerCase() === scopedRegion.trim().toLowerCase();
}

function filterRuntimeLogs(
  logs: RuntimeLogItem[],
  filters: { intent: string; userId: string; region: string; q: string; scopedRegion?: string },
  limit: number,
): RuntimeLogItem[] {
  return logs
    .filter((item) => {
      if (filters.intent && item.intent !== filters.intent) {
        return false;
      }
      if (filters.userId && item.userId !== filters.userId) {
        return false;
      }
      if (filters.region && item.region.toLowerCase() !== filters.region.toLowerCase()) {
        return false;
      }
      if (!matchesRegion(item.region, filters.scopedRegion)) {
        return false;
      }
      if (!filters.q) {
        return true;
      }

      const haystack = `${item.query} ${item.response} ${item.userId}`.toLowerCase();
      return haystack.includes(filters.q.toLowerCase());
    })
    .slice(0, limit);
}

function buildSummary(logs: Array<{ intent: string; createdAt: string }>, totalSimulations: number) {
  const now = Date.now();
  return {
    totalLogs: logs.length,
    whatIfLogs: logs.filter((item) => item.intent === "what_if").length,
    complianceLogs: logs.filter((item) => item.intent === "compliance").length,
    healthLogs: logs.filter((item) => item.intent === "health_risk").length,
    last24h: logs.filter(
      (item) => now - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000,
    ).length,
    totalSimulations,
  };
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession();
  if (!session || !canAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const intent = (searchParams.get("intent") || "").trim();
  const userId = (searchParams.get("userId") || "").trim();
  const regionFilter = (searchParams.get("region") || "").trim();
  const q = (searchParams.get("q") || "").trim();
  const scopedRegion = session.role === "regional_officer" ? session.region : undefined;
  const supabase = getSupabaseServerClient();

  const runtimeLogs = await listRuntimeCopilotLogs();
  const runtimeSimulations = await listRuntimeSimulations();
  const filteredRuntimeLogs = filterRuntimeLogs(
    runtimeLogs,
    { intent, userId, region: regionFilter, q, scopedRegion },
    limit,
  );
  const filteredRuntimeSimulations = runtimeSimulations.filter(
    (item) =>
      matchesRegion(item.region, scopedRegion) &&
      (!regionFilter || item.region.toLowerCase() === regionFilter.toLowerCase()),
  );

  if (!supabase) {
    return NextResponse.json({
      summary: buildSummary(filteredRuntimeLogs, filteredRuntimeSimulations.length),
      logs: filteredRuntimeLogs.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        userId: item.userId,
        role: item.role,
        intent: item.intent,
        region: item.region,
        query: item.query,
        responsePreview: item.response.length > 220 ? `${item.response.slice(0, 220)}...` : item.response,
        location: item.location,
        createdAt: item.createdAt,
      })),
      simulations: filteredRuntimeSimulations.slice(0, 200).map((item) => ({
        scenarioId: item.scenarioId,
        userId: item.userId,
        scenarioType: item.scenarioType,
        region: item.region,
        createdAt: item.createdAt,
      })),
      degraded: true,
      reason: "Supabase server client is not configured; using runtime audit store.",
    });
  }

  let query = supabase
    .from("ai_copilot_logs")
    .select(
      "id, session_id, user_id, role, query, response, intent, region, location_lat, location_lng, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (intent) {
    query = query.eq("intent", intent);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (regionFilter) {
    query = query.ilike("region", regionFilter);
  }

  if (scopedRegion) {
    query = query.ilike("region", scopedRegion);
  }

  if (q) {
    const safeQuery = q.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    query = query.or(
      `query.ilike.%${safeQuery}%,response.ilike.%${safeQuery}%,user_id.ilike.%${safeQuery}%`,
    );
  }

  const { data: logRows, error } = await query;
  if (error) {
    return NextResponse.json(
      {
        summary: buildSummary(filteredRuntimeLogs, filteredRuntimeSimulations.length),
        logs: filteredRuntimeLogs.map((item) => ({
          id: item.id,
          sessionId: item.sessionId,
          userId: item.userId,
          role: item.role,
          intent: item.intent,
          region: item.region,
          query: item.query,
          responsePreview: item.response.length > 220 ? `${item.response.slice(0, 220)}...` : item.response,
          location: item.location,
          createdAt: item.createdAt,
        })),
        simulations: filteredRuntimeSimulations.slice(0, 200).map((item) => ({
          scenarioId: item.scenarioId,
          userId: item.userId,
          scenarioType: item.scenarioType,
          region: item.region,
          createdAt: item.createdAt,
        })),
        degraded: true,
        reason: error.message,
      },
      { status: 200 },
    );
  }

  const logs = (logRows || []) as CopilotLogRow[];
  let simulationQuery = supabase
    .from("ai_simulations")
    .select("scenario_id, user_id, scenario_type, region, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (regionFilter) {
    simulationQuery = simulationQuery.ilike("region", regionFilter);
  }

  if (scopedRegion) {
    simulationQuery = simulationQuery.ilike("region", scopedRegion);
  }

  const { data: simulationRows, error: simulationError } = await simulationQuery;

  const resultLogs = logs.map((item) => ({
    id: item.id,
    sessionId: item.session_id,
    userId: item.user_id,
    role: item.role,
    intent: item.intent,
    region: item.region || "Unknown",
    query: item.query,
    responsePreview:
      item.response.length > 220 ? `${item.response.slice(0, 220)}...` : item.response,
    location: {
      lat: item.location_lat,
      lng: item.location_lng,
    },
    createdAt: item.created_at,
  }));

  const resultSimulations = simulationError
    ? filteredRuntimeSimulations.slice(0, 200).map((item) => ({
        scenarioId: item.scenarioId,
        userId: item.userId,
        scenarioType: item.scenarioType,
        region: item.region,
        createdAt: item.createdAt,
      }))
    : (simulationRows || []).map((item) => ({
        scenarioId: (item as { scenario_id: string }).scenario_id,
        userId: (item as { user_id: string }).user_id,
        scenarioType: (item as { scenario_type: string }).scenario_type,
        region: (item as { region: string }).region,
        createdAt: (item as { created_at: string }).created_at,
      }));

  const summary = buildSummary(resultLogs, resultSimulations.length);

  return NextResponse.json({
    summary,
    logs: resultLogs,
    simulations: resultSimulations,
    degraded: Boolean(simulationError),
    reason: simulationError?.message,
  });
}
