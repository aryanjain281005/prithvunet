import { NextRequest, NextResponse } from "next/server";

const WAQI_TOKEN = process.env.NEXT_PUBLIC_WAQI_TOKEN || "";
const WAQI_BASE = "https://api.waqi.info";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ stations: [] });
  }

  if (!WAQI_TOKEN || WAQI_TOKEN === "YOUR_WAQI_TOKEN_HERE") {
    return NextResponse.json({ stations: [], note: "WAQI token not configured" });
  }

  try {
    const res = await fetch(
      `${WAQI_BASE}/search/?token=${WAQI_TOKEN}&keyword=${encodeURIComponent(q)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      return NextResponse.json({ stations: [] }, { status: res.status });
    }

    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.data)) {
      return NextResponse.json({ stations: [] });
    }

    // Filter to India stations and normalize shape
    const stations = data.data
      .filter((item: { station?: { country?: string }; aqi?: string | number }) => {
        const country = item.station?.country ?? "";
        return country === "IN" || country === "India" || country === "";
      })
      .slice(0, 20)
      .map((item: {
        uid: number;
        aqi: string | number;
        station: { name: string; geo: [number, number]; country?: string };
      }) => ({
        stationId: `WAQI_${item.uid}`,
        stationName: item.station?.name ?? "Unknown",
        city: (item.station?.name ?? "").split(",")[0]?.trim() ?? "Unknown",
        state: "India",
        lat: item.station?.geo?.[0] ?? 0,
        lng: item.station?.geo?.[1] ?? 0,
        aqi: isNaN(Number(item.aqi)) ? 0 : Number(item.aqi),
      }));

    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json({ stations: [] }, { status: 500 });
  }
}
