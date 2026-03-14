import type { CPCBReading, WaterReading, WaterStatus } from "./types";

type WaterParameterKey = keyof WaterReading["parameters"];

const WATER_PARAMETER_ALIASES: Record<string, WaterParameterKey> = {
  PH: "ph",
  BOD: "bod",
  "BIOCHEMICAL OXYGEN DEMAND": "bod",
  DO: "dissolvedOxygen",
  "DISSOLVED OXYGEN": "dissolvedOxygen",
  COD: "cod",
  "CHEMICAL OXYGEN DEMAND": "cod",
  WT: "temperature",
  "WATER TEMPERATURE": "temperature",
  NO3: "nitrate",
  NITRATE: "nitrate",
  CL: "chloride",
  CHLORIDE: "chloride",
  EC: "conductivity",
  CONDUCTIVITY: "conductivity",
  "ELECTRICAL CONDUCTIVITY": "conductivity",
  TOC: "toc",
  "TOTAL ORGANIC CARBON": "toc",
  WTB: "turbidity",
  TURBIDITY: "turbidity",
};

const STATUS_ORDER: Record<WaterStatus, number> = {
  Critical: 0,
  Polluted: 1,
  Caution: 2,
  Safe: 3,
};

function normalizeLabel(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[._]+/g, " ")
    .toUpperCase();
}

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveWaterParameterKey(reading: CPCBReading): WaterParameterKey | null {
  const candidates = [
    reading.stationparameter_no,
    reading.stationparameter_name,
    reading.stationparameter_longname,
    reading.ts_shortname,
    reading.ts_name,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeLabel(candidate);
    if (normalized in WATER_PARAMETER_ALIASES) {
      return WATER_PARAMETER_ALIASES[normalized];
    }
  }

  return null;
}

function cleanStationName(stationName: string): string {
  return stationName.replace(/^[A-Z]{1,3}\d+_/, "").trim();
}

function deriveRiverName(stationName: string): string {
  const cleaned = cleanStationName(stationName);
  const onRiverMatch = cleaned.match(/\bon\s+(?:river\s+)?([^,]+)/i);
  if (onRiverMatch) {
    return onRiverMatch[1].trim();
  }

  const riverMatch = cleaned.match(/river\s+([^,]+)/i);
  if (riverMatch) {
    return riverMatch[1].trim();
  }

  const waterBodyMatch = cleaned.match(/^([^,]+?)(?:\s+(?:canal|creek|lake|dam|barrage|bridge))/i);
  if (waterBodyMatch) {
    return waterBodyMatch[1].trim();
  }

  return cleaned.split(",")[0]?.trim() || "Unknown";
}

function deriveCity(stationName: string, territory: string): string {
  const cleaned = cleanStationName(stationName);
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  const nearMatch = cleaned.match(/(?:at|near|u\/s of|d\/s of)\s+([^,]+)/i);
  if (nearMatch) {
    return nearMatch[1].trim();
  }

  return territory;
}

export function getWaterStatus(parameters: WaterReading["parameters"]): WaterStatus {
  const bod = parameters.bod;
  const dissolvedOxygen = parameters.dissolvedOxygen;
  const ph = parameters.ph;
  const cod = parameters.cod;
  const conductivity = parameters.conductivity;

  if (
    (bod != null && bod >= 10) ||
    (dissolvedOxygen != null && dissolvedOxygen <= 2) ||
    (ph != null && (ph < 5.5 || ph > 9.5)) ||
    (cod != null && cod >= 250)
  ) {
    return "Critical";
  }

  if (
    (bod != null && bod > 6) ||
    (dissolvedOxygen != null && dissolvedOxygen < 4) ||
    (ph != null && (ph < 6 || ph > 9)) ||
    (cod != null && cod > 120)
  ) {
    return "Polluted";
  }

  if (
    (bod != null && bod > 3) ||
    (dissolvedOxygen != null && dissolvedOxygen < 6) ||
    (ph != null && (ph < 6.5 || ph > 8.5)) ||
    (cod != null && cod > 60) ||
    (conductivity != null && conductivity > 1500)
  ) {
    return "Caution";
  }

  return "Safe";
}

export function getWaterStatusColor(status: WaterStatus): string {
  switch (status) {
    case "Critical":
      return "#ef4444";
    case "Polluted":
      return "#f97316";
    case "Caution":
      return "#eab308";
    case "Safe":
    default:
      return "#22c55e";
  }
}

export function formatWaterStations(readings: CPCBReading[]): WaterReading[] {
  const snapshots = new Map<string, WaterReading>();

  for (const reading of readings) {
    const stationId = String(reading.station_id || reading.station_no || "").trim();
    const stationNo = String(reading.station_no || stationId).trim();
    const timestamp = typeof reading.timestamp === "string" ? reading.timestamp : "";
    const snapshotKey = `${stationId || stationNo}::${timestamp}`;

    if (!stationId && !stationNo) {
      continue;
    }

    const lat = toFiniteNumber(reading.station_latitude);
    const lng = toFiniteNumber(reading.station_longitude);
    if (lat == null || lng == null) {
      continue;
    }

    const existing = snapshots.get(snapshotKey);
    const baseRecord: WaterReading = existing ?? {
      stationId: stationNo || stationId,
      stationName: cleanStationName(reading.station_name || stationNo || stationId),
      riverName: deriveRiverName(reading.station_name || stationNo || stationId),
      city: deriveCity(reading.station_name || stationNo || stationId, reading.territory_name || "India"),
      state: reading.territory_name || "India",
      lat,
      lng,
      parameters: {},
      status: "Safe",
      timestamp,
    };

    const parameterKey = resolveWaterParameterKey(reading);
    const value = toFiniteNumber(reading.ts_value);
    if (parameterKey && value != null) {
      (baseRecord.parameters as Record<string, number>)[parameterKey] = value;
    }

    baseRecord.status = getWaterStatus(baseRecord.parameters);
    snapshots.set(snapshotKey, baseRecord);
  }

  const latestByStation = new Map<string, WaterReading>();

  for (const snapshot of snapshots.values()) {
    const current = latestByStation.get(snapshot.stationId);
    if (!current) {
      latestByStation.set(snapshot.stationId, snapshot);
      continue;
    }

    const candidateTs = parseTimestamp(snapshot.timestamp);
    const currentTs = parseTimestamp(current.timestamp);
    const candidateParamCount = Object.keys(snapshot.parameters).length;
    const currentParamCount = Object.keys(current.parameters).length;

    if (candidateTs > currentTs || (candidateTs === currentTs && candidateParamCount > currentParamCount)) {
      latestByStation.set(snapshot.stationId, snapshot);
    }
  }

  return Array.from(latestByStation.values()).sort((left, right) => {
    const statusDiff = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp);
  });
}