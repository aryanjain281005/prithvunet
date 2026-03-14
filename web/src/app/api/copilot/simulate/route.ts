import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRuntimeSimulation, saveRuntimeSimulation } from "@/lib/runtimeStore";

type ScenarioType =
  | "policy_what_if"
  | "shutdown_top_k"
  | "festival_control"
  | "traffic_control"
  | "custom";

interface SimulationRequestBody {
  userId?: string;
  region?: string;
  horizonDays?: number;
  scenarioType?: ScenarioType;
  intervention?: {
    pollutant?: string;
    reductionPct?: number;
    topKUnits?: number;
    notes?: string;
  };
  baseline?: {
    riskIndex?: number;
    aqi?: number;
    bod?: number;
    noise?: number;
  };
  meteorology?: {
    windSpeed?: number;
    humidity?: number;
    temperature?: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildScenarioId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SIM-${date}-${suffix}`;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value;
}

function simulateRisk(request: SimulationRequestBody) {
  const horizonDays = clamp(Math.round(toFiniteNumber(request.horizonDays, 7)), 1, 14);

  const baselineRisk = clamp(
    toFiniteNumber(request.baseline?.riskIndex, toFiniteNumber(request.baseline?.aqi, 180)),
    1,
    500,
  );

  const reductionFromK = clamp(toFiniteNumber(request.intervention?.topKUnits, 0) * 4, 0, 50);
  const reductionPct = clamp(
    toFiniteNumber(request.intervention?.reductionPct, reductionFromK > 0 ? reductionFromK : 20),
    0,
    90,
  );

  const windSpeed = clamp(toFiniteNumber(request.meteorology?.windSpeed, 2.5), 0, 30);
  const humidity = clamp(toFiniteNumber(request.meteorology?.humidity, 60), 10, 100);

  const windFactor = windSpeed >= 4 ? 1.08 : windSpeed <= 1.2 ? 0.92 : 1;
  const humidityFactor = humidity >= 75 ? 0.92 : humidity <= 35 ? 1.03 : 1;
  const weatherFactor = clamp(windFactor * humidityFactor, 0.8, 1.2);

  const absoluteImprovement = baselineRisk * (reductionPct / 100) * 0.62 * weatherFactor;
  const predictedRisk = clamp(baselineRisk - absoluteImprovement, 0, 500);

  const margin = Math.max(10, predictedRisk * 0.11);
  const confidenceLower = clamp(predictedRisk - margin, 0, 500);
  const confidenceUpper = clamp(predictedRisk + margin, 0, 500);

  const timeline = Array.from({ length: horizonDays }, (_, index) => {
    const day = index + 1;
    const progress = day / horizonDays;
    const projectedRisk = clamp(baselineRisk - absoluteImprovement * progress, 0, 500);
    return {
      day,
      projectedRisk: Number(projectedRisk.toFixed(2)),
    };
  });

  return {
    baselineRisk: Number(baselineRisk.toFixed(2)),
    predictedRisk: Number(predictedRisk.toFixed(2)),
    delta: Number((baselineRisk - predictedRisk).toFixed(2)),
    reductionPct,
    confidenceLower: Number(confidenceLower.toFixed(2)),
    confidenceUpper: Number(confidenceUpper.toFixed(2)),
    horizonDays,
    weatherFactor: Number(weatherFactor.toFixed(3)),
    timeline,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SimulationRequestBody;
    const region =
      typeof body.region === "string" && body.region.trim() ? body.region.trim() : "Unknown";

    const simulation = simulateRisk(body);
    const scenarioId = buildScenarioId();
    const userId =
      typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : "anonymous";
    const scenarioType: ScenarioType =
      body.scenarioType &&
      ["policy_what_if", "shutdown_top_k", "festival_control", "traffic_control", "custom"].includes(
        body.scenarioType,
      )
        ? body.scenarioType
        : "policy_what_if";

    const resultPayload = {
      metrics: simulation,
      intervention: body.intervention || {},
      meteorology: body.meteorology || {},
      generatedAt: new Date().toISOString(),
    };
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    await saveRuntimeSimulation({
      scenarioId,
      userId,
      region,
      scenarioType,
      requestPayload: body as Record<string, unknown>,
      resultPayload: resultPayload as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    const supabase = getSupabaseServerClient();
    let persisted = false;

    if (supabase) {
      const { error } = await supabase.from("ai_simulations").insert({
        scenario_id: scenarioId,
        user_id: userId,
        region,
        scenario_type: scenarioType,
        request_payload: body,
        result_payload: resultPayload,
        risk_before: simulation.baselineRisk,
        risk_after: simulation.predictedRisk,
        delta: simulation.delta,
        confidence_lower: simulation.confidenceLower,
        confidence_upper: simulation.confidenceUpper,
        horizon_days: simulation.horizonDays,
        expires_at: expiresAt,
      });

      if (!error) {
        persisted = true;
      }
    }

    return NextResponse.json({
      scenarioId,
      region,
      persisted,
      scenarioType,
      ...simulation,
    });
  } catch {
    return NextResponse.json({ error: "Unable to run simulation" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get("scenarioId");

  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
  }

  const runtimeSimulation = await getRuntimeSimulation(scenarioId);

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    if (runtimeSimulation) {
      return NextResponse.json({
        simulation: {
          scenario_id: runtimeSimulation.scenarioId,
          user_id: runtimeSimulation.userId,
          region: runtimeSimulation.region,
          scenario_type: runtimeSimulation.scenarioType,
          request_payload: runtimeSimulation.requestPayload,
          result_payload: runtimeSimulation.resultPayload,
          expires_at: runtimeSimulation.expiresAt,
          created_at: runtimeSimulation.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Supabase server client is not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("ai_simulations")
    .select("scenario_id, user_id, region, scenario_type, request_payload, result_payload, risk_before, risk_after, delta, confidence_lower, confidence_upper, horizon_days, expires_at, created_at")
    .eq("scenario_id", scenarioId)
    .maybeSingle();

  if (error) {
    if (runtimeSimulation) {
      return NextResponse.json({
        simulation: {
          scenario_id: runtimeSimulation.scenarioId,
          user_id: runtimeSimulation.userId,
          region: runtimeSimulation.region,
          scenario_type: runtimeSimulation.scenarioType,
          request_payload: runtimeSimulation.requestPayload,
          result_payload: runtimeSimulation.resultPayload,
          expires_at: runtimeSimulation.expiresAt,
          created_at: runtimeSimulation.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Unable to fetch simulation" }, { status: 500 });
  }

  if (!data) {
    if (runtimeSimulation) {
      return NextResponse.json({
        simulation: {
          scenario_id: runtimeSimulation.scenarioId,
          user_id: runtimeSimulation.userId,
          region: runtimeSimulation.region,
          scenario_type: runtimeSimulation.scenarioType,
          request_payload: runtimeSimulation.requestPayload,
          result_payload: runtimeSimulation.resultPayload,
          expires_at: runtimeSimulation.expiresAt,
          created_at: runtimeSimulation.createdAt,
        },
        source: "runtime",
      });
    }

    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  return NextResponse.json({ simulation: data });
}
