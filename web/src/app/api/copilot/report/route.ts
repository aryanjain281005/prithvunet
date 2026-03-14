import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRuntimeReport, getRuntimeSimulation, saveRuntimeReport } from "@/lib/runtimeStore";

type ReportFormat = "markdown" | "json";

interface ReportRequestBody {
  scenarioId?: string;
  format?: ReportFormat;
  requestedBy?: string;
}

interface ReportSimulationRecord {
  id?: string;
  scenario_id: string;
  region: string;
  scenario_type: string;
  result_payload: unknown;
  created_at: string;
}

function buildReportId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RPT-${date}-${suffix}`;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value;
}

function buildMarkdownReport(simulation: {
  scenario_id: string;
  region: string;
  scenario_type: string;
  result_payload: unknown;
  created_at: string;
}): string {
  const payload =
    simulation.result_payload && typeof simulation.result_payload === "object"
      ? (simulation.result_payload as Record<string, unknown>)
      : {};

  const metrics =
    payload.metrics && typeof payload.metrics === "object"
      ? (payload.metrics as Record<string, unknown>)
      : {};

  const baselineRisk = toNumber(metrics.baselineRisk);
  const predictedRisk = toNumber(metrics.predictedRisk);
  const delta = toNumber(metrics.delta);
  const confidenceLower = toNumber(metrics.confidenceLower);
  const confidenceUpper = toNumber(metrics.confidenceUpper);
  const horizonDays = Math.round(toNumber(metrics.horizonDays, 7));
  const reductionPct = toNumber(metrics.reductionPct);

  return [
    `# PrithviNet AI Compliance Report`,
    ``,
    `- Report Type: Scenario Simulation`,
    `- Scenario ID: ${simulation.scenario_id}`,
    `- Region: ${simulation.region}`,
    `- Scenario Kind: ${simulation.scenario_type}`,
    `- Generated On: ${new Date().toISOString()}`,
    `- Simulation Created: ${simulation.created_at}`,
    ``,
    `## Executive Summary`,
    `Projected risk changed from **${baselineRisk.toFixed(2)}** to **${predictedRisk.toFixed(2)}** over **${horizonDays} days**.`,
    `Estimated improvement: **${delta.toFixed(2)}** points with intervention reduction at **${reductionPct.toFixed(1)}%**.`,
    ``,
    `## Confidence Band`,
    `- Lower Bound: ${confidenceLower.toFixed(2)}`,
    `- Upper Bound: ${confidenceUpper.toFixed(2)}`,
    ``,
    `## Plain-Language Interpretation`,
    `If this intervention is executed as modeled, regional pollution risk should decline measurably within a week.`,
    `Authorities should still validate outcomes with live station measurements and meteorological drift checks.`,
    ``,
    `## Recommended Next Actions`,
    `1. Verify top violating sources in the selected region.`,
    `2. Issue time-bound intervention notices and monitor daily risk trajectory.`,
    `3. Re-run simulation after new sensor updates to track variance.`,
  ].join("\n");
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  try {
    const body = (await request.json()) as ReportRequestBody;
    const scenarioId = (body.scenarioId || "").trim();

    if (!scenarioId) {
      return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
    }

    const format: ReportFormat = body.format === "json" ? "json" : "markdown";
    let simulation: ReportSimulationRecord | null = null;

    if (supabase) {
      const { data, error: simulationError } = await supabase
        .from("ai_simulations")
        .select("id, scenario_id, region, scenario_type, result_payload, created_at")
        .eq("scenario_id", scenarioId)
        .maybeSingle();

      if (simulationError) {
        console.error("Unable to fetch simulation from Supabase", simulationError);
      } else if (data) {
        simulation = data;
      }
    }

    if (!simulation) {
      const runtimeSimulation = await getRuntimeSimulation(scenarioId);
      if (runtimeSimulation) {
        simulation = {
          scenario_id: runtimeSimulation.scenarioId,
          region: runtimeSimulation.region,
          scenario_type: runtimeSimulation.scenarioType,
          result_payload: runtimeSimulation.resultPayload,
          created_at: runtimeSimulation.createdAt,
        };
      }
    }

    if (!simulation) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
    }

    const reportId = buildReportId();
    const title = `Scenario Report ${simulation.scenario_id}`;

    const markdownContent = buildMarkdownReport(simulation);
    const jsonContent = JSON.stringify(
      {
        reportId,
        title,
        generatedAt: new Date().toISOString(),
        simulation,
      },
      null,
      2,
    );

    const content = format === "json" ? jsonContent : markdownContent;
    let persisted = false;

    if (supabase && simulation.id) {
      const { error: insertError } = await supabase.from("ai_simulation_reports").insert({
        simulation_ref: simulation.id,
        report_id: reportId,
        format,
        title,
        content,
        meta: {
          requestedBy: body.requestedBy || "system",
        },
      });

      if (insertError) {
        console.error("Unable to persist generated report to Supabase", insertError);
      } else {
        persisted = true;
      }
    }

    await saveRuntimeReport({
      reportId,
      scenarioId: simulation.scenario_id,
      format,
      title,
      content,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      reportId,
      scenarioId: simulation.scenario_id,
      format,
      title,
      content,
      persisted,
      source: persisted ? "supabase" : "runtime",
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate report" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();

  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required" }, { status: 400 });
  }

  const runtimeReport = await getRuntimeReport(reportId);

  if (!supabase) {
    if (runtimeReport) {
      return NextResponse.json({
        report: {
          report_id: runtimeReport.reportId,
          format: runtimeReport.format,
          title: runtimeReport.title,
          content: runtimeReport.content,
          created_at: runtimeReport.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Supabase server client is not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("ai_simulation_reports")
    .select("report_id, format, title, content, created_at")
    .eq("report_id", reportId)
    .maybeSingle();

  if (error) {
    if (runtimeReport) {
      return NextResponse.json({
        report: {
          report_id: runtimeReport.reportId,
          format: runtimeReport.format,
          title: runtimeReport.title,
          content: runtimeReport.content,
          created_at: runtimeReport.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Unable to fetch report" }, { status: 500 });
  }

  if (!data) {
    if (runtimeReport) {
      return NextResponse.json({
        report: {
          report_id: runtimeReport.reportId,
          format: runtimeReport.format,
          title: runtimeReport.title,
          content: runtimeReport.content,
          created_at: runtimeReport.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ report: data, source: "supabase" });
}
