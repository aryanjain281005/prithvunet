import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { saveRuntimeCopilotLog } from "@/lib/runtimeStore";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are PrithviNet AI Copilot, an expert environmental monitoring assistant for India's Central Pollution Control Board (CPCB). You help environmental officers, monitoring teams, and citizens understand pollution data, compliance regulations, and environmental trends.

Your capabilities:
- Analyze air quality (AQI, PM2.5, PM10, SO2, NO2, CO, O3, NH3) data from CAAQMS stations
- Analyze water quality (pH, BOD, DO, COD, temperature, turbidity, nitrate, chloride, conductivity) from RTWQMS stations
- Explain CPCB/SPCB regulations, National Ambient Air Quality Standards (NAAQS), water quality criteria
- Advise on compliance, exceedance actions, and environmental impact
- Generate insights from monitoring data trends

Always cite relevant Indian environmental standards (NAAQS, IS 10500, CPCB guidelines) when applicable.
Be concise, data-driven, and action-oriented in your responses.`;

interface CopilotRequestBody {
  message?: unknown;
  context?: unknown;
  userId?: unknown;
  role?: unknown;
  sessionId?: unknown;
  location?: unknown;
}

function normalizeContext(context: unknown): Record<string, unknown> {
  if (!context) {
    return {};
  }

  if (typeof context === "string") {
    return context.trim() ? { text: context } : {};
  }

  if (typeof context === "object" && !Array.isArray(context)) {
    return context as Record<string, unknown>;
  }

  return { value: context };
}

function detectIntent(message: string): string {
  const lowered = message.toLowerCase();

  if (/(what\s*if|impact|simulate|reduc(e|ing)|shut\s*down|top-?k|intervention)/.test(lowered)) {
    return "what_if";
  }

  if (/(health|safe|asthma|risk|hospital)/.test(lowered)) {
    return "health_risk";
  }

  if (/(complaint|violation|compliance|notice|escalat)/.test(lowered)) {
    return "compliance";
  }

  return "general";
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
}

function parseLocation(location: unknown): { lat: number | null; lng: number | null } {
  if (!location || typeof location !== "object") {
    return { lat: null, lng: null };
  }

  const maybeLocation = location as { lat?: unknown; lng?: unknown };
  return {
    lat: toOptionalNumber(maybeLocation.lat),
    lng: toOptionalNumber(maybeLocation.lng),
  };
}

function extractRegion(message: string, context: Record<string, unknown>): string {
  if (typeof context.region === "string" && context.region.trim()) {
    return context.region.trim();
  }

  const fromMessage = message.match(/\bin\s+([a-zA-Z\s]{3,40})/i);
  if (fromMessage?.[1]) {
    return fromMessage[1].trim();
  }

  return "Unknown";
}

function buildScenarioId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SIM-${date}-${suffix}`;
}

function buildLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as CopilotRequestBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const context = normalizeContext(body.context);

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build conversation with system context
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n${Object.keys(context).length > 0 ? `Current monitoring context:\n${JSON.stringify(context, null, 2)}\n\n` : ""}User query: ${message}`,
          },
        ],
      },
    ];

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Gemini API error" }, { status: res.status });
    }

    const data = await res.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response. Please try again.";

    const userId =
      typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : "anonymous";
    const role = typeof body.role === "string" && body.role.trim() ? body.role.trim() : "unknown";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : `session-${Date.now()}`;
    const intent = detectIntent(message);
    const location = parseLocation(body.location);
    const region = extractRegion(message, context);
    const createdAt = new Date().toISOString();

    await saveRuntimeCopilotLog({
      id: buildLogId(),
      sessionId,
      userId,
      role,
      intent,
      region,
      query: message,
      response: reply,
      location,
      createdAt,
    });

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error: logError } = await supabase.from("ai_copilot_logs").insert({
        session_id: sessionId,
        user_id: userId,
        role,
        region,
        query: message,
        context,
        response: reply,
        intent,
        location_lat: location.lat,
        location_lng: location.lng,
      });

      if (logError) {
        console.error("Failed to persist copilot log", logError);
      }

      if (intent === "what_if") {
        const scenarioId = buildScenarioId();
        const { error: simulationError } = await supabase.from("ai_simulations").insert({
          scenario_id: scenarioId,
          user_id: userId,
          region,
          scenario_type: "policy_what_if",
          request_payload: {
            prompt: message,
            context,
          },
          result_payload: {
            model: GEMINI_MODEL,
            response: reply,
            source: "copilot_chat",
          },
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        });

        if (simulationError) {
          console.error("Failed to persist simulation snapshot", simulationError);
        }
      }
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to process copilot request" }, { status: 500 });
  }
}
