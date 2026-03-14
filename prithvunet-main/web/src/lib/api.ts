// ============================================
// PrithviNet Data Fetching & Simulation
// ============================================

import {
  AQIReading,
  AQICategory,
  WaterReading,
  WaterApiResponse,
  NoiseReading,
  Industry,
  Alert,
  DashboardStats,
  TimeSeriesData,
  ForecastPoint,
  WAQIResponse,
  MapBoundsStation,
  CPCBReading,
  DataGovAirRecord,
} from "./types";
import { formatWaterStations } from "./water";
import {
  WAQI_API_BASE,
  WAQI_API_TOKEN,
  MONITORED_CITIES,
  EXTENDED_AIR_CITIES,
  AQI_BREAKPOINTS,
  AIR_LIMITS,
  WATER_LIMITS,
  NOISE_STATIONS,
  NOISE_LIMITS,
  INDUSTRIES_DATA,
  INDIA_BOUNDS,
} from "./constants";

// ============================================
// AQI Helpers
// ============================================

export function getAQICategory(aqi: number): AQICategory {
  const bp = AQI_BREAKPOINTS.find((b) => aqi >= b.min && aqi <= b.max);
  return bp?.category ?? "Severe";
}

export function getAQIColor(aqi: number): string {
  const bp = AQI_BREAKPOINTS.find((b) => aqi >= b.min && aqi <= b.max);
  return bp?.color ?? "#991b1b";
}

export function getAQIEmoji(aqi: number): string {
  const bp = AQI_BREAKPOINTS.find((b) => aqi >= b.min && aqi <= b.max);
  return bp?.emoji ?? "☠️";
}

// ============================================
// WAQI API - Real Air Quality Data
// ============================================

export async function fetchWAQIStation(uid: number): Promise<WAQIResponse | null> {
  try {
    const res = await fetch(`${WAQI_API_BASE}/feed/@${uid}/?token=${WAQI_API_TOKEN}`, {
      next: { revalidate: 900 }, // Cache for 15 minutes
    });
    const data = await res.json();
    if (data.status === "ok") return data;
    return null;
  } catch {
    return null;
  }
}

// Fetch ALL stations in India via Map Bounds API (300+ stations)
export async function fetchMapBoundsData(): Promise<MapBoundsStation[]> {
  if (WAQI_API_TOKEN === "YOUR_WAQI_TOKEN_HERE") return [];
  try {
    const { lat1, lng1, lat2, lng2 } = INDIA_BOUNDS;
    const res = await fetch(
      `${WAQI_API_BASE}/v2/map/bounds?latlng=${lat1},${lng1},${lat2},${lng2}&networks=all&token=${WAQI_API_TOKEN}`,
      { next: { revalidate: 900 } }
    );
    const json = await res.json();
    if (json.status === "ok" && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchAllAirData(): Promise<AQIReading[]> {
  // Try WAQI API first — if token not set, fall back to simulated
  if (WAQI_API_TOKEN === "YOUR_WAQI_TOKEN_HERE") {
    return generateSimulatedAirData();
  }

  // Use map bounds API for ALL stations across India
  const boundsData = await fetchMapBoundsData();
  if (boundsData.length > 0) {
    return boundsData
      .filter((s) => s.aqi !== "-" && !isNaN(Number(s.aqi)))
      .map((s) => {
        const aqi = Number(s.aqi);
        const name = s.station.name;
        // Extract city/state from station name (format: "City, State, Country")
        const parts = name.split(",").map((p) => p.trim());
        const city = parts[0] || name;
        const state = parts.length > 1 ? parts[parts.length - 2] || parts[0] : "India";

        return {
          stationId: `WAQI_${s.uid}`,
          stationName: name,
          city,
          state,
          lat: s.lat,
          lng: s.lon,
          aqi,
          category: getAQICategory(aqi),
          dominantPollutant: "pm25",
          pollutants: {},
          weather: {},
          timestamp: s.station.time || new Date().toISOString(),
        };
      });
  }

  // Fallback: fetch individual MONITORED_CITIES stations
  const readings: AQIReading[] = [];
  for (let i = 0; i < MONITORED_CITIES.length; i += 4) {
    const batch = MONITORED_CITIES.slice(i, i + 4);
    const results = await Promise.all(batch.map((c) => fetchWAQIStation(c.uid)));

    results.forEach((result, idx) => {
      const cityInfo = batch[idx];
      if (result && result.data) {
        const d = result.data;
        readings.push({
          stationId: `WAQI_${d.idx}`,
          stationName: cityInfo.name,
          city: cityInfo.city,
          state: cityInfo.state,
          lat: d.city.geo[0],
          lng: d.city.geo[1],
          aqi: d.aqi,
          category: getAQICategory(d.aqi),
          dominantPollutant: d.dominentpol || "pm25",
          pollutants: {
            pm25: d.iaqi?.pm25?.v,
            pm10: d.iaqi?.pm10?.v,
            so2: d.iaqi?.so2?.v,
            no2: d.iaqi?.no2?.v,
            co: d.iaqi?.co?.v,
            o3: d.iaqi?.o3?.v,
          },
          weather: {
            temp: d.iaqi?.t?.v,
            humidity: d.iaqi?.h?.v,
            windSpeed: d.iaqi?.w?.v,
            pressure: d.iaqi?.p?.v,
          },
          timestamp: d.time.iso,
        });
      }
    });
  }

  return readings.length > 0 ? readings : generateSimulatedAirData();
}

// Merged air data from all sources (WAQI + data.gov.in CAAQMS)
export async function fetchMergedAirData(): Promise<AQIReading[]> {
  const [waqiData, dgovData] = await Promise.all([
    fetchAllAirData(),
    fetchDataGovAir(),
  ]);

  if (dgovData.length === 0) return waqiData;
  if (waqiData.length === 0) return dgovData;

  // Deduplicate: data.gov.in stations that are already in WAQI (by proximity < 0.05 degrees)
  const merged = [...waqiData];
  for (const dgov of dgovData) {
    const isDupe = waqiData.some(
      (w) => Math.abs(w.lat - dgov.lat) < 0.05 && Math.abs(w.lng - dgov.lng) < 0.05
    );
    if (!isDupe) merged.push(dgov);
  }

  return merged;
}

// ============================================
// data.gov.in CAAQMS Air Quality
// ============================================

export async function fetchDataGovAir(): Promise<AQIReading[]> {
  try {
    const res = await fetch("/api/air");
    if (!res.ok) return [];
    const data = await res.json();
    const records: DataGovAirRecord[] = data.records || [];
    if (records.length === 0) return [];

    // Group records by station (each station has multiple pollutant rows)
    const stationMap = new Map<string, DataGovAirRecord[]>();
    for (const r of records) {
      const key = `${r.station}_${r.city}`;
      if (!stationMap.has(key)) stationMap.set(key, []);
      stationMap.get(key)!.push(r);
    }

    const readings: AQIReading[] = [];
    for (const [, stationRecords] of stationMap) {
      const first = stationRecords[0];
      const lat = parseFloat(first.latitude);
      const lng = parseFloat(first.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const pollutants: AQIReading["pollutants"] = {};
      let maxAqi = 0;
      let dominant = "pm25";

      for (const r of stationRecords) {
        const avg = parseFloat(r.pollutant_avg);
        if (isNaN(avg) || avg <= 0) continue;

        const pid = r.pollutant_id?.toUpperCase();
        if (pid === "PM2.5" || pid === "PM25") { pollutants.pm25 = avg; if (avg > maxAqi) { maxAqi = avg; dominant = "pm25"; } }
        else if (pid === "PM10") { pollutants.pm10 = avg; if (avg > maxAqi) { maxAqi = avg; dominant = "pm10"; } }
        else if (pid === "SO2") { pollutants.so2 = avg; }
        else if (pid === "NO2") { pollutants.no2 = avg; }
        else if (pid === "CO") { pollutants.co = avg; }
        else if (pid === "OZONE" || pid === "O3") { pollutants.o3 = avg; }
        else if (pid === "NH3") { pollutants.nh3 = avg; }
      }

      // Estimate AQI from PM2.5 (primary pollutant in India) or PM10
      const aqi = Math.round(
        pollutants.pm25
          ? pollutants.pm25 * 1.0 // PM2.5 avg ≈ AQI for Indian scale
          : pollutants.pm10
            ? pollutants.pm10 * 0.5
            : maxAqi || 50
      );

      readings.push({
        stationId: `DGOV_${first.station?.replace(/\s+/g, "_").slice(0, 20)}`,
        stationName: first.station || "Unknown",
        city: first.city || "Unknown",
        state: first.state || "India",
        lat,
        lng,
        aqi: Math.min(500, Math.max(0, aqi)),
        category: getAQICategory(aqi),
        dominantPollutant: dominant,
        pollutants,
        weather: {},
        timestamp: first.last_update || new Date().toISOString(),
      });
    }

    return readings;
  } catch {
    return [];
  }
}

// ============================================
// Simulated Data Generators
// ============================================

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateSimulatedAirData(): AQIReading[] {
  const now = new Date().toISOString();
  return EXTENDED_AIR_CITIES.map((station, index) => {
    // Simulate realistic AQI based on region — North India higher, South/Northeast lower
    const s = station.state;
    const isNorthHighPollution =
      s === "Delhi" || s === "Uttar Pradesh" || s === "Bihar" || s === "Haryana" ||
      s === "Punjab" || s === "Rajasthan" || s === "Jharkhand" || s === "West Bengal";
    const isSouthLowPollution =
      s === "Karnataka" || s === "Tamil Nadu" || s === "Kerala" ||
      s === "Goa" || s === "Sikkim" || s === "Arunachal Pradesh" || s === "Mizoram";
    const isIndustrialHeavy =
      s === "Chhattisgarh" || s === "Odisha" || s === "Madhya Pradesh" ||
      s === "Gujarat" || s === "Maharashtra";

    const baseAQI = isNorthHighPollution
      ? randomInRange(100, 380)
      : isSouthLowPollution
        ? randomInRange(25, 130)
        : isIndustrialHeavy
          ? randomInRange(80, 280)
          : randomInRange(50, 200);

    const aqi = Math.round(baseAQI);
    return {
      stationId: `SIM_${index}_${station.city.replace(/\s+/g, "_")}`,
      stationName: station.name,
      city: station.city,
      state: station.state,
      lat: station.lat,
      lng: station.lng,
      aqi,
      category: getAQICategory(aqi),
      dominantPollutant: aqi > 200 ? "pm25" : aqi > 100 ? "pm10" : "o3",
      pollutants: {
        pm25: randomInRange(10, Math.min(aqi * 1.1, 450)),
        pm10: randomInRange(20, Math.min(aqi * 1.6, 600)),
        so2: randomInRange(4, 75),
        no2: randomInRange(8, 85),
        co: randomInRange(1, 22),
        o3: randomInRange(8, 110),
      },
      weather: {
        temp: randomInRange(18, 42),
        humidity: randomInRange(25, 90),
        windSpeed: randomInRange(0.5, 18),
        pressure: randomInRange(1003, 1022),
      },
      timestamp: now,
    };
  });
}

export async function generateWaterData(): Promise<WaterReading[]> {
  try {
    const res = await fetch("/api/water?format=stations", { cache: "no-store" });
    if (res.ok) {
      const payload = (await res.json()) as WaterApiResponse | CPCBReading[];
      if (Array.isArray(payload) && payload.length > 0) {
        return formatWaterStations(payload);
      }

      if (Array.isArray((payload as WaterApiResponse).stations)) {
        return (payload as WaterApiResponse).stations;
      }
    }
  } catch {
  }

  return generateSimulatedWaterData();
}

function generateSimulatedWaterData(): WaterReading[] {
  const FALLBACK_STATIONS = [
    { id: "WS01", name: "Ghagra near Manjhi, Chappra", river: "Ghagra", state: "Bihar", lat: 25.78, lng: 84.75 },
    { id: "WS02", name: "Ganga at Varanasi", river: "Ganga", state: "Uttar Pradesh", lat: 25.32, lng: 83.01 },
    { id: "WS03", name: "Yamuna at Wazirabad", river: "Yamuna", state: "Delhi", lat: 28.7, lng: 77.23 },
    { id: "WS04", name: "Yamuna at Okhla", river: "Yamuna", state: "Delhi", lat: 28.57, lng: 77.27 },
    { id: "WS05", name: "Ganga at Haridwar", river: "Ganga", state: "Uttarakhand", lat: 29.96, lng: 78.17 },
  ];
  const now = new Date().toISOString();
  return FALLBACK_STATIONS.map((station) => {
    // Yamuna at Delhi is heavily polluted; Ganga at Haridwar is clean
    const pollutionFactor =
      station.river === "Yamuna" && station.state === "Delhi"
        ? 3.0
        : station.river === "Musi" || station.river === "Cooum"
          ? 2.5
          : station.river === "Ganga" && station.state === "Uttarakhand"
            ? 0.3
            : 1.0;

    const bod = randomInRange(1, 8 * pollutionFactor);
    const dissolvedOxygen = Math.max(1, randomInRange(9 - 3 * pollutionFactor, 9));
    const ph = randomInRange(6.5, 8.5);
    const cod = randomInRange(3, 15 * pollutionFactor);

    let status: WaterReading["status"] = "Safe";
    if (bod > 10 || dissolvedOxygen < 2) status = "Critical";
    else if (bod > 6 || dissolvedOxygen < 4) status = "Polluted";
    else if (bod > 3 || dissolvedOxygen < 6) status = "Caution";

    return {
      stationId: station.id,
      stationName: station.name,
      riverName: station.river,
      city: station.name.split(" at ")[1]?.split(",")[0]?.trim() || station.state,
      state: station.state,
      lat: station.lat,
      lng: station.lng,
      parameters: {
        bod,
        dissolvedOxygen,
        ph,
        temperature: randomInRange(20, 32),
        nitrate: randomInRange(0.1, 15 * pollutionFactor),
        chloride: randomInRange(10, 50 * pollutionFactor),
        cod,
        toc: randomInRange(2, 10 * pollutionFactor),
        turbidity: randomInRange(2, 20 * pollutionFactor),
        conductivity: randomInRange(100, 500 * pollutionFactor),
      },
      status,
      timestamp: now,
    };
  });
}

export function generateNoiseData(): NoiseReading[] {
  const now = new Date();
  const hour = now.getHours();
  const isDay = hour >= 6 && hour < 22;

  return NOISE_STATIONS.map((station) => {
    const limit = isDay
      ? NOISE_LIMITS[station.zone].day
      : NOISE_LIMITS[station.zone].night;

    // Noise is higher during day, peak at rush hours (8-10 AM, 5-8 PM)
    const rushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const baseFactor = isDay ? (rushHour ? 1.15 : 1.0) : 0.7;

    const baseNoise =
      station.zone === "Industrial"
        ? randomInRange(55, 80)
        : station.zone === "Commercial"
          ? randomInRange(50, 75)
          : station.zone === "Silence"
            ? randomInRange(35, 55)
            : randomInRange(40, 60);

    const leq = Math.round(baseNoise * baseFactor * 10) / 10;

    return {
      stationId: station.id,
      stationName: station.name,
      city: station.city,
      zone: station.zone,
      lat: station.lat,
      lng: station.lng,
      leq,
      lmax: Math.round((leq + randomInRange(5, 15)) * 10) / 10,
      lmin: Math.round((leq - randomInRange(5, 15)) * 10) / 10,
      limit,
      exceedance: leq > limit,
      dayNight: isDay ? "Day" as const : "Night" as const,
      timestamp: now.toISOString(),
    };
  });
}

export function generateIndustryData(): Industry[] {
  const statuses: Industry["status"][] = [
    "Compliant",
    "Compliant",
    "Compliant",
    "Non-Compliant",
    "Under Review",
    "Compliant",
  ];

  return INDUSTRIES_DATA.map((ind) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    return {
      ...ind,
      status,
      lastInspection: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      emissions: {
        pm: randomInRange(20, status === "Non-Compliant" ? 250 : 120),
        so2: randomInRange(10, status === "Non-Compliant" ? 150 : 70),
        nox: randomInRange(15, status === "Non-Compliant" ? 200 : 100),
        co: randomInRange(5, status === "Non-Compliant" ? 80 : 40),
      },
      effluents: {
        ph: randomInRange(status === "Non-Compliant" ? 5.0 : 6.5, status === "Non-Compliant" ? 10.0 : 8.5),
        bod: randomInRange(5, status === "Non-Compliant" ? 60 : 25),
        cod: randomInRange(10, status === "Non-Compliant" ? 120 : 50),
        tss: randomInRange(10, status === "Non-Compliant" ? 150 : 80),
      },
    };
  });
}

export function generateAlerts(
  airData: AQIReading[],
  waterData: WaterReading[],
  noiseData: NoiseReading[]
): Alert[] {
  const alerts: Alert[] = [];
  let id = 1;

  // Air alerts
  airData.forEach((r) => {
    if (r.aqi > 300) {
      alerts.push({
        id: `ALR_${id++}`,
        type: "air",
        severity: r.aqi > 400 ? "Critical" : "Warning",
        status: "Active",
        title: `AQI ${r.category} — ${r.stationName}`,
        description: `AQI level of ${r.aqi} detected at ${r.stationName}. Dominant pollutant: ${r.dominantPollutant?.toUpperCase()}. Immediate action recommended.`,
        stationName: r.stationName,
        parameter: "AQI",
        value: r.aqi,
        limit: 300,
        region: `${r.city}, ${r.state}`,
        timestamp: r.timestamp,
      });
    }
    if (r.pollutants.pm25 && r.pollutants.pm25 > AIR_LIMITS.pm25) {
      alerts.push({
        id: `ALR_${id++}`,
        type: "air",
        severity: r.pollutants.pm25 > AIR_LIMITS.pm25 * 3 ? "Critical" : "Warning",
        status: "Active",
        title: `PM₂.₅ Exceedance — ${r.stationName}`,
        description: `PM₂.₅ at ${r.pollutants.pm25} µg/m³ exceeds limit of ${AIR_LIMITS.pm25} µg/m³.`,
        stationName: r.stationName,
        parameter: "PM2.5",
        value: r.pollutants.pm25,
        limit: AIR_LIMITS.pm25,
        region: `${r.city}, ${r.state}`,
        timestamp: r.timestamp,
      });
    }
  });

  // Water alerts
  waterData.forEach((r) => {
    if (r.status === "Critical" || r.status === "Polluted") {
      alerts.push({
        id: `ALR_${id++}`,
        type: "water",
        severity: r.status === "Critical" ? "Critical" : "Warning",
        status: "Active",
        title: `Water Quality ${r.status} — ${r.riverName}`,
        description: `${r.stationName}: BOD=${r.parameters.bod} mg/L, DO=${r.parameters.dissolvedOxygen} mg/L. Water quality is ${r.status.toLowerCase()}.`,
        stationName: r.stationName,
        parameter: "BOD",
        value: r.parameters.bod || 0,
        limit: 3,
        region: r.state,
        timestamp: r.timestamp,
      });
    }
  });

  // Noise alerts
  noiseData.forEach((r) => {
    if (r.exceedance) {
      alerts.push({
        id: `ALR_${id++}`,
        type: "noise",
        severity: r.leq > r.limit + 15 ? "Critical" : "Warning",
        status: "Active",
        title: `Noise Exceedance — ${r.stationName}`,
        description: `Noise level ${r.leq} dB(A) exceeds ${r.zone} zone limit of ${r.limit} dB(A).`,
        stationName: r.stationName,
        parameter: "Leq",
        value: r.leq,
        limit: r.limit,
        region: r.city,
        timestamp: r.timestamp,
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { Critical: 0, Warning: 1, Info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Generate time-series history (for charts)
export function generateTimeSeries(hours: number = 24, baseValue: number = 100): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 60 * 60 * 1000);
    const hour = t.getHours();
    // Simulate daily pattern: higher during rush hours
    const rush = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21) ? 1.3 : 1.0;
    const night = hour >= 0 && hour <= 5 ? 0.6 : 1.0;
    const value = Math.round(baseValue * rush * night * (0.8 + Math.random() * 0.4));
    data.push({
      timestamp: t.toISOString(),
      value,
      label: `${hour}:00`,
    });
  }
  return data;
}

// Generate forecast data
export function generateForecast(currentValue: number, hours: number = 72): ForecastPoint[] {
  const data: ForecastPoint[] = [];
  const now = Date.now();
  let val = currentValue;
  for (let i = 1; i <= hours; i++) {
    const t = new Date(now + i * 60 * 60 * 1000);
    const hour = t.getHours();
    const rush = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21) ? 1.2 : 1.0;
    const night = hour >= 0 && hour <= 5 ? 0.7 : 1.0;
    val = val * 0.95 + currentValue * 0.05 * rush * night + (Math.random() - 0.5) * 20;
    val = Math.max(10, val);
    const uncertainty = Math.max(10, i * 0.8);
    data.push({
      timestamp: t.toISOString(),
      value: Math.round(val),
      lower: Math.round(Math.max(0, val - uncertainty)),
      upper: Math.round(val + uncertainty),
    });
  }
  return data;
}

// Dashboard aggregated stats
export function getDashboardStats(
  airData: AQIReading[],
  alerts: Alert[],
  industries: Industry[],
  waterCount: number = 0,
  noiseCount: number = 0,
): DashboardStats {
  const avgAQI = airData.length
    ? Math.round(airData.reduce((sum, r) => sum + r.aqi, 0) / airData.length)
    : 0;
  const compliant = industries.filter((i) => i.status === "Compliant").length;
  const total = airData.length + waterCount + noiseCount;

  return {
    totalStations: total,
    liveStations: Math.max(0, total - 2),
    activeAlerts: alerts.filter((a) => a.status === "Active").length,
    criticalAlerts: alerts.filter((a) => a.severity === "Critical" && a.status === "Active").length,
    avgAQI,
    industriesMonitored: industries.length,
    complianceRate: industries.length ? Math.round((compliant / industries.length) * 100) : 0,
  };
}
