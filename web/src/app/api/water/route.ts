import { NextRequest, NextResponse } from "next/server";

const CPCB_RTWQMS_BASE = process.env.CPCB_RTWQMS_BASE || "https://rtwqmsdb1.cpcb.gov.in/data/internet";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "data";

  try {
    let url: string;
    if (type === "stations") {
      url = `${CPCB_RTWQMS_BASE}/stations.json`;
    } else {
      // Default: fetch real-time readings (all parameters, all stations)
      url = `${CPCB_RTWQMS_BASE}/layers/10/index.json`;
    }

    const res = await fetch(url, { next: { revalidate: 900 } });

    if (!res.ok) {
      return NextResponse.json({ error: "CPCB RTWQMS API error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch water quality data" }, { status: 500 });
  }
}
