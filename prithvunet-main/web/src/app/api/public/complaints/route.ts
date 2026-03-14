import { NextResponse } from "next/server";
import type { PublicComplaintPayload, PublicComplaintRecord } from "@/lib/types";

const complaintStore: PublicComplaintRecord[] = [];

function isValidPayload(payload: Partial<PublicComplaintPayload>): payload is PublicComplaintPayload {
  return Boolean(
    payload.name &&
      payload.mobile &&
      payload.email &&
      payload.address &&
      payload.state &&
      payload.city &&
      payload.category &&
      payload.locationDetails &&
      payload.observedAt &&
      payload.description,
  );
}

function buildComplaintId(): string {
  const serial = String(complaintStore.length + 1).padStart(4, "0");
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PN-${date}-${serial}`;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<PublicComplaintPayload>;

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "All complaint fields are required" }, { status: 400 });
    }

    const record: PublicComplaintRecord = {
      ...payload,
      complaintId: buildComplaintId(),
      status: "Submitted",
      createdAt: new Date().toISOString(),
    };

    complaintStore.push(record);

    return NextResponse.json({
      complaintId: record.complaintId,
      status: record.status,
      createdAt: record.createdAt,
    });
  } catch {
    return NextResponse.json({ error: "Unable to submit complaint" }, { status: 500 });
  }
}