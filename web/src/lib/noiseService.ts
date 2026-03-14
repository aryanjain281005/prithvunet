import { checkCompliance } from "@/lib/ComplianceEngine";
import { BASELINE_STATION_IDS, getSnapshotFromBaseline } from "@/lib/noiseBaseline";
import type { NoiseSnapshotPayload, NoiseSource, NoiseStation } from "@/lib/noiseTypes";

type ParsedNoiseMetrics = {
  laf?: number;
  las?: number;
  lcf?: number;
  lcs?: number;
  lae?: number;
  lce?: number;
  lpeak?: number;
  lpeak_day?: number;
  max?: number;
  min?: number;
  battery?: number;
};

interface ServerBridgePayload {
  station_id: number;
  blocked: boolean;
  has_numeric: boolean;
  metrics: {
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
  fetched_at: string;
  mode: string;
}

type NoiseFetchMode = "fast" | "full";

const CPCB_URL = "http://www.cpcbnoise.com/index3.php";

const PROXIES = [
  { name: "corsproxy", prefix: "https://corsproxy.io/?", encode: true },
  { name: "allorigins", prefix: "https://api.allorigins.win/raw?url=", encode: true },
  { name: "cors-anywhere", prefix: "https://cors-anywhere.herokuapp.com/", encode: false },
] as const;

const SOURCE_META: Record<NoiseSource, { label: string; detail: string }> = {
  live: {
    label: "Live",
    detail: "Live data from CPCB NANMN network via bridge/proxy path.",
  },
  snapshot: {
    label: "Snapshot",
    detail: "Showing last-known CPCB snapshot while live feed is unavailable.",
  },
  simulated: {
    label: "Simulated",
    detail: "Baseline + seeded simulation from captured CPCB readings.",
  },
};

const NAME_MAP: Record<string, keyof ParsedNoiseMetrics> = {
  laf: "laf",
  las: "las",
  lcf: "lcf",
  lcs: "lcs",
  lae: "lae",
  lce: "lce",
  lpeak: "lpeak",
  lpeakday: "lpeak_day",
  leqa: "laf",
  leqamax: "max",
  leqamin: "min",
  battery: "battery",
  bateria: "battery",
};

function withTimeout(timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timer),
  };
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function safeNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned === "--" || cleaned === " -- ") return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function seededUnit(stationId: number, salt: number, bucket: number): number {
  const raw = Math.sin(stationId * 12.9898 + salt * 78.233 + bucket * 0.01573) * 43758.5453;
  return raw - Math.floor(raw);
}

function vary(base: number, stationId: number, salt: number, range: number, bucket: number): number {
  const offset = (seededUnit(stationId, salt, bucket) - 0.5) * range * 2;
  return Number((base + offset).toFixed(1));
}

function buildStation(payload: NoiseSnapshotPayload, source: NoiseSource, updatedAt: string): NoiseStation {
  const sourceMeta = SOURCE_META[source];
  const laf = payload.laf ?? 0;

  return {
    station_id: payload.station_id,
    name: payload.name,
    city: payload.city,
    state: payload.state,
    zone: payload.zone,
    lat: payload.lat,
    lng: payload.lng,
    is_online: source === "live",
    last_updated: updatedAt,
    laf: payload.laf,
    las: payload.las,
    lcf: payload.lcf,
    lcs: payload.lcs,
    lae: payload.lae,
    lce: payload.lce,
    lpeak: payload.lpeak,
    lpeak_day: payload.lpeak_day,
    max: payload.max,
    min: payload.min,
    battery: payload.battery,
    source,
    source_label: sourceMeta.label,
    source_detail: sourceMeta.detail,
    compliance: checkCompliance(laf, payload.zone, new Date(updatedAt)),
  };
}

function mergeMetrics(stationId: number, metrics: ParsedNoiseMetrics, source: NoiseSource, updatedAt: string): NoiseStation {
  const baseline = getSnapshotFromBaseline(stationId);
  if (!baseline) {
    throw new Error(`Missing baseline for station ${stationId}`);
  }

  const merged: NoiseSnapshotPayload = {
    ...baseline,
    laf: metrics.laf ?? baseline.laf,
    las: metrics.las ?? baseline.las,
    lcf: metrics.lcf ?? baseline.lcf,
    lcs: metrics.lcs ?? baseline.lcs,
    lae: metrics.lae ?? baseline.lae,
    lce: metrics.lce ?? baseline.lce,
    lpeak: metrics.lpeak ?? baseline.lpeak,
    lpeak_day: metrics.lpeak_day ?? baseline.lpeak_day,
    max: metrics.max ?? baseline.max,
    min: metrics.min ?? baseline.min,
    battery: metrics.battery ?? baseline.battery,
  };

  return buildStation(merged, source, updatedAt);
}

export function parseNoiseXML(xml: string): ParsedNoiseMetrics | null {
  if (!xml.includes("<canal")) return null;

  const parser = new DOMParser();
  const document = parser.parseFromString(xml, "text/xml");
  const result: ParsedNoiseMetrics = {};

  document.querySelectorAll("canal").forEach((canal) => {
    const alias = canal.getAttribute("nombre")
      ?? canal.querySelector('[name="alias"]')?.textContent
      ?? canal.querySelector('[name="nombre"]')?.textContent;
    const value = canal.getAttribute("valor")
      ?? canal.querySelector('[name="valor"]')?.textContent;
    const key = alias ? NAME_MAP[normalizeName(alias)] : undefined;
    const parsed = safeNumber(value);

    if (key && parsed !== null) {
      result[key] = parsed;
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clear();
  }
}

async function tryLiveProxy(stationId: number): Promise<NoiseStation | null> {
  const targetUrl = `${CPCB_URL}?option=datos&task=getnoise&estacion=${stationId}`;

  for (const proxy of PROXIES) {
    const requestUrl = proxy.encode
      ? `${proxy.prefix}${encodeURIComponent(targetUrl)}`
      : `${proxy.prefix}${targetUrl}`;

    try {
      const xml = await fetchText(requestUrl, 1500);
      if (!xml.includes("<canal") || xml.includes("Unauthorised")) {
        continue;
      }

      const parsed = parseNoiseXML(xml);
      if (!parsed?.laf) {
        continue;
      }

      return mergeMetrics(stationId, parsed, "live", new Date().toISOString());
    } catch {
      continue;
    }
  }

  return null;
}

async function tryLiveBridge(stationId: number): Promise<NoiseStation | null> {
  try {
    const { signal, clear } = withTimeout(3500);
    try {
      const response = await fetch(`/api/noise/live/${stationId}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as ServerBridgePayload;
      if (payload.blocked || !payload.has_numeric) {
        return null;
      }

      if (typeof payload.metrics.laf !== "number") {
        return null;
      }

      const metrics: ParsedNoiseMetrics = {
        laf: payload.metrics.laf,
        las: payload.metrics.las ?? undefined,
        lcf: payload.metrics.lcf ?? undefined,
        lcs: payload.metrics.lcs ?? undefined,
        lae: payload.metrics.lae ?? undefined,
        lce: payload.metrics.lce ?? undefined,
        lpeak: payload.metrics.lpeak ?? undefined,
        lpeak_day: payload.metrics.lpeak_day ?? undefined,
        max: payload.metrics.max ?? undefined,
        min: payload.metrics.min ?? undefined,
        battery: payload.metrics.battery ?? undefined,
      };

      return mergeMetrics(stationId, metrics, "live", payload.fetched_at || new Date().toISOString());
    } finally {
      clear();
    }
  } catch {
    return null;
  }
}

async function trySnapshot(stationId: number): Promise<NoiseStation | null> {
  try {
    const { signal, clear } = withTimeout(2000);
    try {
      const response = await fetch(`/api/noise/snapshot/${stationId}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        return null;
      }

      const snapshot = (await response.json()) as NoiseSnapshotPayload;
      return buildStation(snapshot, "snapshot", snapshot.snapshot_taken);
    } finally {
      clear();
    }
  } catch {
    return null;
  }
}

export function simulateFromBaseline(stationId: number): NoiseStation {
  const baseline = getSnapshotFromBaseline(stationId);
  if (!baseline) {
    throw new Error(`Missing baseline for station ${stationId}`);
  }

  const bucket = Math.floor(Date.now() / 60_000);
  const laf = vary(baseline.laf ?? 55, stationId, 1, 2, bucket);
  const las = vary(baseline.las ?? laf - 0.4, stationId, 2, 2, bucket);
  const lcf = vary(baseline.lcf ?? laf + 5, stationId, 3, 2.4, bucket);
  const lcs = vary(baseline.lcs ?? (baseline.lcf ?? laf + 5), stationId, 4, 2.2, bucket);
  const lae = vary(baseline.lae ?? (baseline.laf ?? laf) + 1.0, stationId, 5, 1.6, bucket);
  const lce = vary(baseline.lce ?? (baseline.lcf ?? lcf) + 3.6, stationId, 6, 1.8, bucket);
  const basePeak = baseline.lpeak ?? baseline.lcf ?? baseline.laf ?? 65;
  const baseFloor = baseline.laf ?? laf;
  const lpeak = Number((basePeak + seededUnit(stationId, 7, bucket) * 3).toFixed(1));
  const max = Math.max(laf + 3, vary(baseline.max ?? basePeak + 4, stationId, 8, 2.2, bucket));
  const min = Math.min(laf - 2, vary(baseline.min ?? baseFloor - 7, stationId, 9, 1.6, bucket));
  const battery = Math.max(12.8, vary(baseline.battery ?? 13.5, stationId, 10, 0.18, bucket));

  return buildStation(
    {
      ...baseline,
      laf,
      las,
      lcf,
      lcs,
      lae,
      lce,
      lpeak,
      max: Number(max.toFixed(1)),
      min: Number(min.toFixed(1)),
      battery: Number(battery.toFixed(2)),
      source: "snapshot",
      snapshot_taken: new Date(bucket * 60_000).toISOString(),
    },
    "simulated",
    new Date(bucket * 60_000).toISOString(),
  );
}

export async function fetchStationData(stationId: number, mode: NoiseFetchMode = "full"): Promise<NoiseStation> {
  if (mode === "fast") {
    const snapshot = await trySnapshot(stationId);
    if (snapshot) {
      return snapshot;
    }

    return simulateFromBaseline(stationId);
  }

  const bridgeLive = await tryLiveBridge(stationId);
  if (bridgeLive) {
    return bridgeLive;
  }

  const live = await tryLiveProxy(stationId);
  if (live) {
    return live;
  }

  const snapshot = await trySnapshot(stationId);
  if (snapshot) {
    return snapshot;
  }

  return simulateFromBaseline(stationId);
}

export async function fetchAllStationData(mode: NoiseFetchMode = "full"): Promise<NoiseStation[]> {
  const results = await Promise.allSettled(
    BASELINE_STATION_IDS.map((stationId) => fetchStationData(stationId, mode))
  );

  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    return [simulateFromBaseline(BASELINE_STATION_IDS[index])];
  });
}
