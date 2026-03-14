import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build conversation with system context
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n${context ? `Current monitoring context:\n${context}\n\n` : ""}User query: ${message}`,
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

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to process copilot request" }, { status: 500 });
  }
}
