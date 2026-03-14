import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

type JsonObject = Record<string, unknown>;

export interface RuntimeSimulationRecord {
  scenarioId: string;
  userId: string;
  region: string;
  scenarioType: string;
  requestPayload: JsonObject;
  resultPayload: JsonObject;
  createdAt: string;
  expiresAt?: string;
}

export interface RuntimeReportRecord {
  reportId: string;
  scenarioId: string;
  format: "markdown" | "json";
  title: string;
  content: string;
  createdAt: string;
}

export interface RuntimeComplaintTriageEvent {
  modelVersion: string;
  sentimentScore: number | null;
  decision: string;
  keywordHits: string[];
  createdAt: string;
}

export interface RuntimeComplaintRecord {
  id: string;
  complaintId: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  city: string;
  category: string;
  locationDetails: string;
  observedAt: string;
  description: string;
  status: string;
  triagePriority: string;
  corroborationScore: number | null;
  triageSummary: string;
  createdAt: string;
  updatedAt: string;
  latestTriageEvent: RuntimeComplaintTriageEvent | null;
}

export interface RuntimeCopilotLogRecord {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
  intent: string;
  region: string;
  query: string;
  response: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  createdAt: string;
}

interface RuntimeStoreFile {
  simulations: RuntimeSimulationRecord[];
  reports: RuntimeReportRecord[];
  complaints: RuntimeComplaintRecord[];
  copilotLogs: RuntimeCopilotLogRecord[];
}

const STORE_FILE_PATH = path.join(os.tmpdir(), "prithvinet-runtime-store.json");

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) {
    return false;
  }
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) {
    return false;
  }
  return ts < Date.now();
}

function emptyStore(): RuntimeStoreFile {
  return {
    simulations: [],
    reports: [],
    complaints: [],
    copilotLogs: [],
  };
}

async function readStore(): Promise<RuntimeStoreFile> {
  try {
    const raw = await fs.readFile(STORE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<RuntimeStoreFile>;
    return {
      simulations: Array.isArray(parsed.simulations)
        ? (parsed.simulations as RuntimeSimulationRecord[])
        : [],
      reports: Array.isArray(parsed.reports) ? (parsed.reports as RuntimeReportRecord[]) : [],
      complaints: Array.isArray(parsed.complaints)
        ? (parsed.complaints as RuntimeComplaintRecord[])
        : [],
      copilotLogs: Array.isArray(parsed.copilotLogs)
        ? (parsed.copilotLogs as RuntimeCopilotLogRecord[])
        : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: RuntimeStoreFile): Promise<void> {
  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(store), "utf8");
}

export async function saveRuntimeSimulation(record: RuntimeSimulationRecord): Promise<void> {
  const store = await readStore();
  store.simulations = store.simulations.filter((item) => item.scenarioId !== record.scenarioId);
  store.simulations.push(record);
  await writeStore(store);
}

export async function getRuntimeSimulation(scenarioId: string): Promise<RuntimeSimulationRecord | null> {
  const store = await readStore();
  const record = store.simulations.find((item) => item.scenarioId === scenarioId) || null;

  if (!record) {
    return null;
  }

  if (isExpired(record.expiresAt)) {
    store.simulations = store.simulations.filter((item) => item.scenarioId !== scenarioId);
    await writeStore(store);
    return null;
  }

  return record;
}

export async function listRuntimeSimulations(): Promise<RuntimeSimulationRecord[]> {
  const store = await readStore();
  const active = store.simulations.filter((item) => !isExpired(item.expiresAt));
  if (active.length !== store.simulations.length) {
    store.simulations = active;
    await writeStore(store);
  }
  return active.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveRuntimeReport(record: RuntimeReportRecord): Promise<void> {
  const store = await readStore();
  store.reports = store.reports.filter((item) => item.reportId !== record.reportId);
  store.reports.push(record);
  await writeStore(store);
}

export async function getRuntimeReport(reportId: string): Promise<RuntimeReportRecord | null> {
  const store = await readStore();
  return store.reports.find((item) => item.reportId === reportId) || null;
}

export async function saveRuntimeComplaint(record: RuntimeComplaintRecord): Promise<void> {
  const store = await readStore();
  store.complaints = store.complaints.filter((item) => item.id !== record.id);
  store.complaints.push(record);
  await writeStore(store);
}

export async function listRuntimeComplaints(): Promise<RuntimeComplaintRecord[]> {
  const store = await readStore();
  return store.complaints.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateRuntimeComplaintStatus(
  complaintId: string,
  status: string,
): Promise<RuntimeComplaintRecord | null> {
  const store = await readStore();
  const record = store.complaints.find((item) => item.id === complaintId || item.complaintId === complaintId);
  if (!record) {
    return null;
  }

  record.status = status;
  record.updatedAt = new Date().toISOString();
  await writeStore(store);
  return record;
}

export async function saveRuntimeCopilotLog(record: RuntimeCopilotLogRecord): Promise<void> {
  const store = await readStore();
  store.copilotLogs = store.copilotLogs.filter((item) => item.id !== record.id);
  store.copilotLogs.push(record);
  await writeStore(store);
}

export async function listRuntimeCopilotLogs(): Promise<RuntimeCopilotLogRecord[]> {
  const store = await readStore();
  return store.copilotLogs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
