import { NextResponse } from "next/server";

type ParsedMetrics = {
  laf: number | null;
  las: number | null;
  lcf: number | null;
  lcs: number | null;
  lae: number | null;
  lce: number | null;
  lpeak: number | null;
  lpeak_day: number | null;
  max: number | null;
  min: number | null;
  battery: number | null;
};

const CPCB_HOST = "http://www.cpcbnoise.com";

const EMPTY_METRICS: ParsedMetrics = {
  laf: null,
  las: null,
  lcf: null,
  lcs: null,
  lae: null,
  lce: null,
  lpeak: null,
  lpeak_day: null,
  max: null,
  min: null,
  battery: null,
};

const MYDOC_CHANNEL_MAP: Record<string, keyof ParsedMetrics> = {
  "3": "laf",
  "7": "lcf",
  "11": "las",
  "13": "lcs",
  "15": "lae",
  "17": "lce",
  "19": "lpeak",
  "21": "battery",
};

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function safeNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned === "--" || cleaned === " -- ") return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
}

function getAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match?.[1] ?? null;
}

function mapMetricKey(rawName: string): keyof ParsedMetrics | null {
  const token = normalizeToken(rawName);
  if (!token) return null;

  if (token.includes("laf") || token === "leqa") return "laf";
  if (token.includes("las")) return "las";
  if (token.includes("lcf")) return "lcf";
  if (token.includes("lcs")) return "lcs";
  if (token.includes("lae")) return "lae";
  if (token.includes("lce")) return "lce";
  if (token.includes("picodia") || token.includes("lpeakday") || token.includes("daylpeak")) return "lpeak_day";
  if (token.includes("lpeak") || token.includes("pico")) return "lpeak";
  if (token.includes("leqamax") || token.endsWith("max")) return "max";
  if (token.includes("leqamin") || token.endsWith("min")) return "min";
  if (token.includes("battery") || token.includes("bateria")) return "battery";

  return null;
}

function parseCanalesXml(xml: string): ParsedMetrics {
  const metrics: ParsedMetrics = { ...EMPTY_METRICS };
  const tagMatches = xml.match(/<canal\b[^>]*>/gi) ?? [];

  for (const tag of tagMatches) {
    const nombre = getAttr(tag, "nombre") ?? "";
    const id = getAttr(tag, "id") ?? "";
    const key = mapMetricKey(nombre) ?? mapMetricKey(id);
    if (!key) continue;

    const value = safeNumber(getAttr(tag, "valor"));
    if (value !== null) {
      metrics[key] = value;
    }
  }

  return metrics;
}

function parseMydocXml(xml: string): ParsedMetrics {
  const metrics: ParsedMetrics = { ...EMPTY_METRICS };
  const canalRegex = /<canal[^>]*numcanal="(\d+)"[^>]*>([\s\S]*?)<\/canal>/gi;

  let canalMatch: RegExpExecArray | null = canalRegex.exec(xml);
  while (canalMatch) {
    const channel = canalMatch[1];
    const key = MYDOC_CHANNEL_MAP[channel];
    if (key) {
      const body = canalMatch[2];
      const valueMatch = body.match(/<param[^>]*name="valor"[^>]*>([\s\S]*?)<\/param>/i);
      const value = safeNumber(valueMatch?.[1]);
      if (value !== null) {
        metrics[key] = value;
      }
    }

    canalMatch = canalRegex.exec(xml);
  }

  return metrics;
}

function parseMetrics(xml: string): ParsedMetrics {
  if (xml.includes("<mydoc")) {
    return parseMydocXml(xml);
  }

  return parseCanalesXml(xml);
}

function hasNumeric(metrics: ParsedMetrics): boolean {
  return Object.values(metrics).some((value) => typeof value === "number");
}

function readSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const combined = response.headers.get("set-cookie");
  return combined ? [combined] : [];
}

function upsertCookies(jar: Map<string, string>, setCookieHeaders: string[]): void {
  for (const cookieHeader of setCookieHeaders) {
    const firstPart = cookieHeader.split(";", 1)[0]?.trim();
    if (!firstPart) continue;

    const eqIndex = firstPart.indexOf("=");
    if (eqIndex <= 0) continue;

    const name = firstPart.slice(0, eqIndex).trim();
    const value = firstPart.slice(eqIndex + 1).trim();
    if (name && value) {
      jar.set(name, value);
    }
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const timeout = withTimeout(timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "follow",
      signal: timeout.signal,
    });
  } finally {
    timeout.clear();
  }
}

async function fetchCpcbViaGuestSession(stationId: number): Promise<string> {
  const cookies = new Map<string, string>();

  const homeResponse = await fetchWithTimeout(`${CPCB_HOST}/`, {
    headers: {
      "User-Agent": "PrithviNet-NoiseBridge/1.0",
      Accept: "text/html,*/*",
    },
    method: "GET",
  }, 3000);

  upsertCookies(cookies, readSetCookieHeaders(homeResponse));

  const loginBody = new URLSearchParams({
    username: "Guest",
    passwd: "guest",
    option: "login",
  });

  const loginResponse = await fetchWithTimeout(`${CPCB_HOST}/index.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PrithviNet-NoiseBridge/1.0",
      Accept: "text/html,*/*",
      ...(cookies.size > 0 ? { Cookie: cookieHeader(cookies) } : {}),
    },
    body: loginBody.toString(),
  }, 3000);

  upsertCookies(cookies, readSetCookieHeaders(loginResponse));

  const dataUrl = `${CPCB_HOST}/index3.php?option=datos&task=getnoise&estacion=${stationId}`;
  const dataResponse = await fetchWithTimeout(dataUrl, {
    method: "GET",
    headers: {
      "User-Agent": "PrithviNet-NoiseBridge/1.0",
      Accept: "application/xml,text/xml,*/*",
      ...(cookies.size > 0 ? { Cookie: cookieHeader(cookies) } : {}),
    },
  }, 3500);

  return await dataResponse.text();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stationId: string }> },
) {
  const { stationId } = await params;
  const parsedStationId = Number.parseInt(stationId, 10);
  if (!Number.isFinite(parsedStationId)) {
    return NextResponse.json({ error: "Invalid station id" }, { status: 400 });
  }

  try {
    const xml = await fetchCpcbViaGuestSession(parsedStationId);
    const unauthorized = xml.includes("Unauthorised attempt");
    const metrics = unauthorized ? { ...EMPTY_METRICS } : parseMetrics(xml);

    return NextResponse.json({
      station_id: parsedStationId,
      blocked: unauthorized,
      has_numeric: hasNumeric(metrics),
      metrics,
      fetched_at: new Date().toISOString(),
      mode: "guest-session-bridge",
    });
  } catch {
    return NextResponse.json({
      station_id: parsedStationId,
      blocked: false,
      has_numeric: false,
      metrics: { ...EMPTY_METRICS },
      fetched_at: new Date().toISOString(),
      mode: "guest-session-bridge",
      error: "fetch_failed",
    });
  }
}
