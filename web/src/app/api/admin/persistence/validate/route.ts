import { NextResponse } from "next/server";
import { getSupabaseServerClient, hasSupabaseServiceRoleConfig } from "@/lib/supabaseServer";
import { getRequestSession } from "@/lib/serverSession";
import type { UserRole } from "@/lib/types";

type AllowedRole = Extract<UserRole, "super_admin" | "regional_officer">;

function canAccess(role: UserRole | undefined): role is AllowedRole {
  return role === "super_admin" || role === "regional_officer";
}

function buildValidationIds() {
  const stamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    scenarioId: `SIM-VALIDATE-${stamp}-${suffix}`,
    reportId: `RPT-VALIDATE-${stamp}-${suffix}`,
  };
}

export async function GET() {
  const session = await getRequestSession();
  if (!session || !canAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        simulationPersisted: false,
        reportPersisted: false,
        reason: "Supabase server client is not configured",
      },
      { status: 503 },
    );
  }

  const { data: simulationProbe, error: simulationProbeError } = await supabase
    .from("ai_simulations")
    .select("id")
    .limit(1);

  const { data: reportProbe, error: reportProbeError } = await supabase
    .from("ai_simulation_reports")
    .select("id")
    .limit(1);

  return NextResponse.json({
    ok: !simulationProbeError && !reportProbeError,
    usingServiceRole: hasSupabaseServiceRoleConfig(),
    simulationTableReady: !simulationProbeError,
    reportTableReady: !reportProbeError,
    simulationProbeCount: Array.isArray(simulationProbe) ? simulationProbe.length : 0,
    reportProbeCount: Array.isArray(reportProbe) ? reportProbe.length : 0,
    errors: {
      simulation: simulationProbeError?.message || null,
      report: reportProbeError?.message || null,
    },
  });
}

export async function POST() {
  const session = await getRequestSession();
  if (!session || !canAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        simulationPersisted: false,
        reportPersisted: false,
        reason: "Supabase server client is not configured",
      },
      { status: 503 },
    );
  }

  const { scenarioId, reportId } = buildValidationIds();

  let simulationPersisted = false;
  let reportPersisted = false;
  let simulationDbId: string | null = null;
  let simulationErrorMessage: string | null = null;
  let reportErrorMessage: string | null = null;

  const { data: insertedSimulation, error: simulationError } = await supabase
    .from("ai_simulations")
    .insert({
      scenario_id: scenarioId,
      user_id: session.sub,
      region: session.region || "Unknown",
      scenario_type: "policy_what_if",
      request_payload: { validation: true },
      result_payload: { validation: true },
      risk_before: 100,
      risk_after: 90,
      delta: 10,
      confidence_lower: 85,
      confidence_upper: 95,
      horizon_days: 1,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (!simulationError && insertedSimulation?.id) {
    simulationPersisted = true;
    simulationDbId = insertedSimulation.id as string;

    const { error: reportError } = await supabase
      .from("ai_simulation_reports")
      .insert({
        simulation_ref: simulationDbId,
        report_id: reportId,
        format: "json",
        title: "Validation Report",
        content: "{\"validation\":true}",
        meta: {
          validation: true,
          requestedBy: session.sub,
        },
      });

    if (!reportError) {
      reportPersisted = true;
    } else {
      reportErrorMessage = reportError.message;
    }
  } else {
    simulationErrorMessage = simulationError?.message || "Unknown simulation insert error";
  }

  // Cleanup validation rows.
  if (simulationDbId) {
    await supabase.from("ai_simulation_reports").delete().eq("report_id", reportId);
    await supabase.from("ai_simulations").delete().eq("id", simulationDbId);
  }

  return NextResponse.json({
    ok: simulationPersisted && reportPersisted,
    usingServiceRole: hasSupabaseServiceRoleConfig(),
    simulationPersisted,
    reportPersisted,
    ids: {
      scenarioId,
      reportId,
    },
    errors: {
      simulation: simulationErrorMessage,
      report: reportErrorMessage,
    },
  });
}
