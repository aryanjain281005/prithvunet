import { AIR_LIMITS } from "@/lib/constants";

export type MonitoringSource = "self_report" | "iot_sensor";
export type ReportKind = "daily_emission" | "monthly_compliance" | "special_monitoring";

export interface PollutantReading {
  name: string;
  value: number;
  unit: string;
  limit: number;
}

export interface IndustryReportSubmission {
  id: string;
  industryId: string;
  location: string;
  region: string;
  timestamp: string;
  reportKind: ReportKind;
  monitoringSource: MonitoringSource;
  airPollutants: PollutantReading[];
  waterPollutants: PollutantReading[];
  noiseLevelDb: number;
  noiseLimitDb: number;
  violationCount: number;
  submittedBy: string;
}

export interface ViolationAlert {
  id: string;
  submissionId: string;
  industryId: string;
  location: string;
  region: string;
  parameter: string;
  value: number;
  limit: number;
  unit: string;
  status: "Exceeded";
  createdAt: string;
}

export interface MissingReportReminder {
  industryId: string;
  location: string;
  daysSinceDue: number;
  stage: "due" | "email_reminder" | "sms_dashboard_warning" | "non_compliance_flag";
  action: string;
}

export interface IndustryRiskRow {
  industryId: string;
  location: string;
  violations: number;
  lastReport: string;
  status: "Compliant" | "High Risk" | "Non-Compliant";
  repeatOffender: boolean;
  escalationLevel: 1 | 2 | 3 | 4;
  regionalRisk: "Low" | "Medium" | "High";
}

export type MonitoringReviewStatus = "Pending Review" | "Verified" | "Recheck Required" | "Escalated";

export interface MonitoringReview {
  reportId: string;
  status: MonitoringReviewStatus;
  reviewer: string;
  reviewedAt: string;
  note?: string;
}

export interface ComplianceCaseRecord {
  caseId: string;
  reportId: string;
  industryId: string;
  location: string;
  region: string;
  assignedTo: string;
  assignedRole: "regional_officer";
  status: "Open" | "Under Inspection" | "Notice Issued" | "Closed";
  escalationLevel: 3 | 4;
  createdAt: string;
  createdBy: string;
  summary: string;
  history: Array<{
    at: string;
    by: string;
    action: string;
  }>;
}

export type ComplianceCaseAction = "issue_warning" | "schedule_inspection" | "close_case";

interface StoredState {
  submissions: IndustryReportSubmission[];
  alerts: ViolationAlert[];
}

const STORAGE_KEY = "pn_industry_repo_v1";
const REVIEW_STORAGE_KEY = "pn_industry_review_v1";
const CASE_STORAGE_KEY = "pn_compliance_cases_v1";

const REGIONAL_OFFICERS: Record<string, string> = {
  Gujarat: "Rakesh Gupta",
  Maharashtra: "Priya Sharma",
  Rajasthan: "Kavita Joshi",
  Jharkhand: "Priya Sharma",
  Delhi: "Meena Devi",
};

const AIR_PARAMETER_LIMITS: Record<string, { label: string; limit: number; unit: string }> = {
  so2: { label: "SO2", limit: AIR_LIMITS.so2, unit: "ug/m3" },
  nox: { label: "NOx", limit: AIR_LIMITS.no2, unit: "ug/m3" },
  pm25: { label: "PM2.5", limit: AIR_LIMITS.pm25, unit: "ug/m3" },
};

const WATER_PARAMETER_LIMITS: Record<string, { label: string; limit: number; unit: string }> = {
  ph: { label: "pH", limit: 8.5, unit: "" },
  bod: { label: "BOD", limit: 30, unit: "mg/L" },
  cod: { label: "COD", limit: 250, unit: "mg/L" },
};

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  daily_emission: "Daily Emission Log",
  monthly_compliance: "Monthly Compliance Report",
  special_monitoring: "Special Monitoring Report",
};

export const SOURCE_LABELS: Record<MonitoringSource, string> = {
  self_report: "Self Report",
  iot_sensor: "IoT Sensor",
};

function nowIso(): string {
  return new Date().toISOString();
}

function safeParseState(raw: string | null): StoredState {
  if (!raw) {
    return { submissions: [], alerts: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
    };
  } catch {
    return { submissions: [], alerts: [] };
  }
}

function readState(): StoredState {
  if (typeof window === "undefined") {
    return { submissions: [], alerts: [] };
  }
  return safeParseState(window.localStorage.getItem(STORAGE_KEY));
}

function writeState(state: StoredState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readReviewState(): Record<string, MonitoringReview> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, MonitoringReview>;
    return parsed || {};
  } catch {
    return {};
  }
}

function writeReviewState(state: Record<string, MonitoringReview>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

function readCaseState(): ComplianceCaseRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ComplianceCaseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCaseState(state: ComplianceCaseRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(state));
}

function assignRegionalOfficer(region: string): string {
  return REGIONAL_OFFICERS[region] || "Priya Sharma";
}

function buildComplianceSummary(submission: IndustryReportSubmission): string {
  const issues = [
    ...submission.airPollutants.filter(isExceeded).map((item) => `${item.name} ${item.value}/${item.limit}`),
    ...submission.waterPollutants.filter(isExceeded).map((item) => `${item.name} ${item.value}/${item.limit}`),
  ];

  if (submission.noiseLevelDb > submission.noiseLimitDb) {
    issues.push(`Noise ${submission.noiseLevelDb}/${submission.noiseLimitDb}`);
  }

  return issues.length > 0 ? issues.join(", ") : "Escalated for manual inspection";
}

function createComplianceCase(submission: IndustryReportSubmission, reviewer: string): ComplianceCaseRecord {
  const existingCases = readCaseState();
  const nextId = `CASE-${String(existingCases.length + 1).padStart(4, "0")}`;
  const escalationLevel: 3 | 4 = submission.violationCount >= 4 ? 4 : 3;
  const createdAt = nowIso();

  return {
    caseId: nextId,
    reportId: submission.id,
    industryId: submission.industryId,
    location: submission.location,
    region: submission.region,
    assignedTo: assignRegionalOfficer(submission.region),
    assignedRole: "regional_officer",
    status: escalationLevel === 4 ? "Notice Issued" : "Under Inspection",
    escalationLevel,
    createdAt,
    createdBy: reviewer,
    summary: buildComplianceSummary(submission),
    history: [
      {
        at: createdAt,
        by: reviewer,
        action: `Case created from monitoring escalation and assigned to ${assignRegionalOfficer(submission.region)}`,
      },
    ],
  };
}

export function buildAirReadings(values: { so2: number; nox: number; pm25: number }): PollutantReading[] {
  return Object.entries(values).map(([key, value]) => {
    const cfg = AIR_PARAMETER_LIMITS[key];
    return {
      name: cfg.label,
      value,
      unit: cfg.unit,
      limit: cfg.limit,
    };
  });
}

export function buildWaterReadings(values: { ph: number; bod: number; cod: number }): PollutantReading[] {
  return Object.entries(values).map(([key, value]) => {
    const cfg = WATER_PARAMETER_LIMITS[key];
    return {
      name: cfg.label,
      value,
      unit: cfg.unit,
      limit: cfg.limit,
    };
  });
}

function isExceeded(reading: PollutantReading): boolean {
  if (reading.name.toLowerCase() === "ph") {
    return reading.value > reading.limit || reading.value < 6.5;
  }
  return reading.value > reading.limit;
}

function buildAlerts(submission: IndustryReportSubmission): ViolationAlert[] {
  const collected: ViolationAlert[] = [];
  const merged = [...submission.airPollutants, ...submission.waterPollutants];

  merged.forEach((reading, idx) => {
    if (!isExceeded(reading)) {
      return;
    }

    collected.push({
      id: `AL-${submission.id}-${idx + 1}`,
      submissionId: submission.id,
      industryId: submission.industryId,
      location: submission.location,
      region: submission.region,
      parameter: reading.name,
      value: reading.value,
      limit: reading.limit,
      unit: reading.unit,
      status: "Exceeded",
      createdAt: nowIso(),
    });
  });

  if (submission.noiseLevelDb > submission.noiseLimitDb) {
    collected.push({
      id: `AL-${submission.id}-N`,
      submissionId: submission.id,
      industryId: submission.industryId,
      location: submission.location,
      region: submission.region,
      parameter: "Noise",
      value: submission.noiseLevelDb,
      limit: submission.noiseLimitDb,
      unit: "dB",
      status: "Exceeded",
      createdAt: nowIso(),
    });
  }

  return collected;
}

export function submitIndustryReport(input: Omit<IndustryReportSubmission, "id" | "timestamp" | "violationCount">): IndustryReportSubmission {
  const state = readState();
  const nextId = `REP-${String(state.submissions.length + 1).padStart(4, "0")}`;

  const submission: IndustryReportSubmission = {
    ...input,
    id: nextId,
    timestamp: nowIso(),
    violationCount: 0,
  };

  const generatedAlerts = buildAlerts(submission);
  submission.violationCount = generatedAlerts.length;

  const updated: StoredState = {
    submissions: [submission, ...state.submissions],
    alerts: [...generatedAlerts, ...state.alerts],
  };

  writeState(updated);
  return submission;
}

export function getRepositoryState(): StoredState {
  return readState();
}

export function getMonitoringReviews(): Record<string, MonitoringReview> {
  return readReviewState();
}

export function getComplianceCases(): ComplianceCaseRecord[] {
  return readCaseState().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function applyComplianceCaseAction(input: {
  caseId: string;
  action: ComplianceCaseAction;
  actor: string;
}) {
  const cases = readCaseState();
  const target = cases.find((item) => item.caseId === input.caseId);
  if (!target) {
    return;
  }

  const at = nowIso();

  if (input.action === "issue_warning") {
    target.status = "Notice Issued";
    target.history.unshift({
      at,
      by: input.actor,
      action: "Warning notice issued to industry",
    });
  }

  if (input.action === "schedule_inspection") {
    target.status = "Under Inspection";
    target.history.unshift({
      at,
      by: input.actor,
      action: "Inspection requested for Monitoring Team follow-up",
    });
  }

  if (input.action === "close_case") {
    target.status = "Closed";
    target.history.unshift({
      at,
      by: input.actor,
      action: "Case closed after RO review",
    });
  }

  writeCaseState(cases);
}

export function markMonitoringReview(input: {
  reportId: string;
  status: MonitoringReviewStatus;
  reviewer: string;
  note?: string;
}) {
  const state = readReviewState();
  state[input.reportId] = {
    reportId: input.reportId,
    status: input.status,
    reviewer: input.reviewer,
    reviewedAt: nowIso(),
    note: input.note,
  };
  writeReviewState(state);

  if (input.status === "Escalated") {
    const repository = readState();
    const submission = repository.submissions.find((item) => item.id === input.reportId);
    if (!submission) {
      return;
    }

    const existingCases = readCaseState();
    const alreadyExists = existingCases.some((item) => item.reportId === input.reportId);
    if (alreadyExists) {
      return;
    }

    const nextCase = createComplianceCase(submission, input.reviewer);
    writeCaseState([nextCase, ...existingCases]);
  }
}

export function getMissingReportReminders(referenceDate = new Date()): MissingReportReminder[] {
  const { submissions } = readState();
  const byIndustry = new Map<string, IndustryReportSubmission>();

  submissions.forEach((entry) => {
    const existing = byIndustry.get(entry.industryId);
    if (!existing || new Date(existing.timestamp) < new Date(entry.timestamp)) {
      byIndustry.set(entry.industryId, entry);
    }
  });

  const reminders: MissingReportReminder[] = [];

  byIndustry.forEach((entry) => {
    const last = new Date(entry.timestamp);
    const due = new Date(last);
    due.setDate(due.getDate() + 30);

    const diffMs = referenceDate.getTime() - due.getTime();
    const daysSinceDue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceDue < 0) {
      return;
    }

    let stage: MissingReportReminder["stage"] = "due";
    let action = "Due date reached";

    if (daysSinceDue >= 7) {
      stage = "non_compliance_flag";
      action = "Non-compliance flag issued";
    } else if (daysSinceDue >= 3) {
      stage = "sms_dashboard_warning";
      action = "SMS + dashboard warning";
    } else if (daysSinceDue >= 2) {
      stage = "email_reminder";
      action = "Email reminder sent";
    }

    reminders.push({
      industryId: entry.industryId,
      location: entry.location,
      daysSinceDue,
      stage,
      action,
    });
  });

  return reminders.sort((a, b) => b.daysSinceDue - a.daysSinceDue);
}

function pickStatus(violations: number, daysSinceLast: number): IndustryRiskRow["status"] {
  if (daysSinceLast > 7) {
    return "Non-Compliant";
  }
  if (violations >= 3) {
    return "High Risk";
  }
  return "Compliant";
}

function pickEscalationLevel(violations: number, daysSinceLast: number): 1 | 2 | 3 | 4 {
  if (daysSinceLast > 10 || violations >= 6) {
    return 4;
  }
  if (daysSinceLast > 7 || violations >= 4) {
    return 3;
  }
  if (daysSinceLast > 3 || violations >= 2) {
    return 2;
  }
  return 1;
}

function pickRegionalRisk(totalIndustryViolations: number): IndustryRiskRow["regionalRisk"] {
  if (totalIndustryViolations >= 6) {
    return "High";
  }
  if (totalIndustryViolations >= 3) {
    return "Medium";
  }
  return "Low";
}

export function buildRiskRows(referenceDate = new Date()): IndustryRiskRow[] {
  const { submissions } = readState();

  const grouped = new Map<string, IndustryReportSubmission[]>();
  submissions.forEach((entry) => {
    const current = grouped.get(entry.industryId) || [];
    current.push(entry);
    grouped.set(entry.industryId, current);
  });

  const regionTotals = new Map<string, number>();

  grouped.forEach((entries) => {
    const region = entries[0]?.region || "Unknown";
    const sum = entries.reduce((acc, item) => acc + item.violationCount, 0);
    regionTotals.set(region, (regionTotals.get(region) || 0) + sum);
  });

  const rows: IndustryRiskRow[] = [];

  grouped.forEach((entries, industryId) => {
    const ordered = [...entries].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    const latest = ordered[0];
    const totalViolations = ordered.reduce((acc, item) => acc + item.violationCount, 0);
    const daysSinceLast = Math.floor((referenceDate.getTime() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60 * 24));

    rows.push({
      industryId,
      location: latest.location,
      violations: totalViolations,
      lastReport: latest.timestamp,
      status: pickStatus(totalViolations, daysSinceLast),
      repeatOffender: totalViolations >= 4,
      escalationLevel: pickEscalationLevel(totalViolations, daysSinceLast),
      regionalRisk: pickRegionalRisk(regionTotals.get(latest.region) || 0),
    });
  });

  return rows.sort((a, b) => b.violations - a.violations);
}

export function seedIndustryDemoData() {
  const state = readState();
  if (state.submissions.length > 0) {
    return;
  }

  const seedEntries: Array<Omit<IndustryReportSubmission, "id" | "timestamp" | "violationCount">> = [
    {
      industryId: "IND-102",
      location: "Gujarat Steel Plant",
      region: "Gujarat",
      reportKind: "monthly_compliance",
      monitoringSource: "self_report",
      submittedBy: "Vikram Singh",
      airPollutants: buildAirReadings({ so2: 120, nox: 86, pm25: 91 }),
      waterPollutants: buildWaterReadings({ ph: 8.8, bod: 38, cod: 320 }),
      noiseLevelDb: 82,
      noiseLimitDb: 75,
    },
    {
      industryId: "IND-210",
      location: "Textile Unit B",
      region: "Rajasthan",
      reportKind: "daily_emission",
      monitoringSource: "iot_sensor",
      submittedBy: "Rakesh Gupta",
      airPollutants: buildAirReadings({ so2: 52, nox: 45, pm25: 38 }),
      waterPollutants: buildWaterReadings({ ph: 7.3, bod: 18, cod: 140 }),
      noiseLevelDb: 68,
      noiseLimitDb: 75,
    },
    {
      industryId: "IND-333",
      location: "Chemical Plant C",
      region: "Maharashtra",
      reportKind: "special_monitoring",
      monitoringSource: "self_report",
      submittedBy: "Anita Kumari",
      airPollutants: buildAirReadings({ so2: 95, nox: 112, pm25: 74 }),
      waterPollutants: buildWaterReadings({ ph: 9.2, bod: 34, cod: 295 }),
      noiseLevelDb: 88,
      noiseLimitDb: 75,
    },
  ];

  seedEntries.forEach((entry) => {
    submitIndustryReport(entry);
  });
}
