import { NextResponse } from "next/server";

import { getSnapshotFromBaseline } from "@/lib/noiseBaseline";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stationId: string }> },
) {
  const { stationId } = await params;
  const parsedId = Number.parseInt(stationId, 10);

  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ error: "Invalid station id" }, { status: 400 });
  }

  const snapshot = getSnapshotFromBaseline(parsedId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}