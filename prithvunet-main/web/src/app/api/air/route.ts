import { NextResponse } from "next/server";

const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || "";
const DATA_GOV_AIR_RESOURCE = process.env.DATA_GOV_AIR_RESOURCE || "";
const DATA_GOV_BASE = "https://api.data.gov.in/resource";

export async function GET() {
  if (!DATA_GOV_API_KEY || !DATA_GOV_AIR_RESOURCE) {
    return NextResponse.json({ error: "Missing data.gov.in API configuration" }, { status: 500 });
  }

  try {
    // data.gov.in returns max 1000 per request; total is ~1782 records
    // Fetch both pages in parallel
    const buildUrl = (offset: number) =>
      `${DATA_GOV_BASE}/${DATA_GOV_AIR_RESOURCE}?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=${offset}`;

    const [res1, res2] = await Promise.all([
      fetch(buildUrl(0), { next: { revalidate: 900 } }),
      fetch(buildUrl(1000), { next: { revalidate: 900 } }),
    ]);

    if (!res1.ok) {
      return NextResponse.json({ error: "data.gov.in API error" }, { status: res1.status });
    }

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    const records = [
      ...(data1.records || []),
      ...(res2.ok ? data2.records || [] : []),
    ];

    return NextResponse.json({
      records,
      total: data1.total || records.length,
      count: records.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch air quality data" }, { status: 500 });
  }
}
