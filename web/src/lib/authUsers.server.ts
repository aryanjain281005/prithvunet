import "server-only";

import type { AuthUser } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

interface AuthRecord {
  user: AuthUser;
  password: string;
}

const defaultPassword = process.env.AUTH_DEFAULT_PASSWORD || "ChangeMe123!";

const AUTH_RECORDS: AuthRecord[] = [
  {
    user: {
      id: "U001",
      name: "Dr. Rajesh Kumar",
      email: "rajesh@spcb.gov.in",
      role: "super_admin",
      region: "All India",
      avatar: "SA",
    },
    password: process.env.AUTH_SUPER_ADMIN_PASSWORD || defaultPassword,
  },
  {
    user: {
      id: "U002",
      name: "Priya Sharma",
      email: "priya@mpcb.gov.in",
      role: "regional_officer",
      region: "Maharashtra",
      avatar: "RO",
    },
    password: process.env.AUTH_REGIONAL_OFFICER_PASSWORD || defaultPassword,
  },
  {
    user: {
      id: "U003",
      name: "Arun Patel",
      email: "arun@cpcb.gov.in",
      role: "monitoring_team",
      region: "Gujarat",
      avatar: "MT",
    },
    password: process.env.AUTH_MONITORING_TEAM_PASSWORD || defaultPassword,
  },
  {
    user: {
      id: "U004",
      name: "Vikram Singh",
      email: "vikram@tatasteel.com",
      role: "industry_user",
      region: "Jharkhand",
      avatar: "IU",
    },
    password: process.env.AUTH_INDUSTRY_USER_PASSWORD || defaultPassword,
  },
];

const byEmail = new Map<string, AuthRecord>(
  AUTH_RECORDS.map((record) => [record.user.email.toLowerCase(), record]),
);

export function verifyCredentials(email: string, password: string): AuthUser | null {
  const record = byEmail.get(email.trim().toLowerCase());
  if (!record) {
    return null;
  }

  if (record.password !== password) {
    return null;
  }

  return record.user;
}

export function getDemoLoginEmails(): Array<{ role: UserRole; email: string }> {
  return AUTH_RECORDS.map((record) => ({ role: record.user.role, email: record.user.email }));
}
