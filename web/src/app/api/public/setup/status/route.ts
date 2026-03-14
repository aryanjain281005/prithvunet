import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const REQUIRED_PROBES = [
  { table: "users", select: "id" },
  { table: "regional_offices", select: "id" },
  { table: "monitoring_locations", select: "id" },
  { table: "parameter_units", select: "id" },
  { table: "prescribed_limits", select: "id" },
  { table: "public_complaints", select: "id,triage_priority" },
  { table: "complaint_triage_events", select: "id,decision" },
  { table: "ai_copilot_logs", select: "id,region" },
  { table: "ai_simulations", select: "id,scenario_id" },
  { table: "ai_simulation_reports", select: "id,report_id" },
] as const;

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase environment is not configured",
        configured: false,
      },
      { status: 503 },
    );
  }

  const checks = await Promise.all(
    REQUIRED_PROBES.map(async ({ table, select }) => {
      const { error, status } = await supabase.from(table).select(select).limit(1);
      return {
        table,
        ok: !error && status < 400,
        error: error?.message || null,
      };
    }),
  );

  const missingTables = checks.filter((item) => !item.ok).map((item) => item.table);

  return NextResponse.json({
    ok: missingTables.length === 0,
    configured: true,
    requiredTableCount: REQUIRED_PROBES.length,
    missingTableCount: missingTables.length,
    missingTables,
    checks,
  });
}
