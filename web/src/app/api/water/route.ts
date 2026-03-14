import { request as httpsRequest } from "node:https";
import { NextRequest, NextResponse } from "next/server";
import type { CPCBReading, WaterApiResponse, WaterReading } from "@/lib/types";
import { formatWaterStations } from "@/lib/water";

const CPCB_RTWQMS_BASE = process.env.CPCB_RTWQMS_BASE || "https://rtwqmsdb1.cpcb.gov.in/data/internet";

export const runtime = "nodejs";

function fetchCpcbJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
        },
        rejectUnauthorized: false,
      },
      (response) => {
        let data = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const statusCode = response.statusCode ?? 500;
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`CPCB RTWQMS API error: ${statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error("CPCB RTWQMS API returned invalid JSON"));
          }
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
}

function applyFilters(stations: WaterReading[], request: NextRequest): WaterReading[] {
  const state = request.nextUrl.searchParams.get("state")?.trim().toLowerCase() || "";
  const city = request.nextUrl.searchParams.get("city")?.trim().toLowerCase() || "";
  const station = request.nextUrl.searchParams.get("station")?.trim().toLowerCase() || "";
  const status = request.nextUrl.searchParams.get("status")?.trim() || "";
  const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() || "";
  const freshHours = Number(request.nextUrl.searchParams.get("freshHours") || "72");
  const freshnessCutoff = Number.isFinite(freshHours) && freshHours > 0
    ? Date.now() - freshHours * 60 * 60 * 1000
    : 0;

  return stations.filter((item) => {
    if (freshnessCutoff && Date.parse(item.timestamp) < freshnessCutoff) return false;
    if (state && item.state.toLowerCase() !== state) return false;
    if (city && item.city.toLowerCase() !== city) return false;
    if (station && item.stationName.toLowerCase() !== station && item.stationId.toLowerCase() !== station) return false;
    if (status && item.status !== status) return false;

    if (search) {
      const haystack = `${item.stationName} ${item.riverName} ${item.city} ${item.state}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function buildStationResponse(stations: WaterReading[]): WaterApiResponse {
  const updatedAt = stations.reduce((latest, station) => {
    if (!latest) {
      return station.timestamp;
    }
    return Date.parse(station.timestamp) > Date.parse(latest) ? station.timestamp : latest;
  }, "");

  return {
    stations,
    filters: {
      states: Array.from(new Set(stations.map((item) => item.state))).sort(),
      cities: Array.from(new Set(stations.map((item) => item.city))).sort(),
      stations: Array.from(new Set(stations.map((item) => item.stationName))).sort(),
      statuses: ["Safe", "Caution", "Polluted", "Critical"],
    },
    meta: {
      count: stations.length,
      updatedAt: updatedAt || new Date().toISOString(),
    },
  };
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "data";
  const format = request.nextUrl.searchParams.get("format") || "raw";

  try {
    let url: string;
    if (type === "stations") {
      url = `${CPCB_RTWQMS_BASE}/stations.json`;
    } else {
      url = `${CPCB_RTWQMS_BASE}/layers/10/index.json`;
    }

    const data = await fetchCpcbJson<unknown>(url);

    if (type !== "stations" && format === "stations") {
      const stations = formatWaterStations(Array.isArray(data) ? (data as CPCBReading[]) : []);
      const filteredStations = applyFilters(stations, request);

      return NextResponse.json(buildStationResponse(filteredStations), {
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": format === "raw" ? "public, max-age=300" : "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch water quality data" }, { status: 500 });
  }
}
