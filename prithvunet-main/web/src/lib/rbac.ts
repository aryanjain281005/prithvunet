import type { UserRole } from "@/lib/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  avatar: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin (State HQ)",
  regional_officer: "Regional Officer",
  monitoring_team: "Monitoring Team",
  industry_user: "Industry User",
  citizen: "Citizen",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-500/20 text-purple-400",
  regional_officer: "bg-blue-500/20 text-blue-400",
  monitoring_team: "bg-green-500/20 text-green-400",
  industry_user: "bg-orange-500/20 text-orange-400",
  citizen: "bg-cyan-500/20 text-cyan-400",
};

const ROUTE_RULES: Array<{ pattern: RegExp; roles: UserRole[] }> = [
  { pattern: /^\/$/, roles: ["super_admin", "regional_officer", "monitoring_team", "industry_user"] },
  { pattern: /^\/map(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team", "citizen"] },
  { pattern: /^\/alerts(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team", "industry_user"] },
  { pattern: /^\/monitoring\/submit(?:\/|$)/, roles: ["industry_user"] },
  { pattern: /^\/monitoring\/logs(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team"] },
  { pattern: /^\/monitoring\/campaigns(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team"] },
  { pattern: /^\/compliance(?:\/|$)/, roles: ["super_admin", "regional_officer"] },
  { pattern: /^\/industries(?:\/|$)/, roles: ["super_admin", "regional_officer", "industry_user"] },
  { pattern: /^\/water(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team"] },
  { pattern: /^\/noise(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team", "citizen"] },
  { pattern: /^\/reports(?:\/|$)/, roles: ["super_admin", "regional_officer", "monitoring_team"] },
  { pattern: /^\/copilot(?:\/|$)/, roles: ["super_admin", "regional_officer"] },
  { pattern: /^\/admin\/regions(?:\/|$)/, roles: ["super_admin"] },
  { pattern: /^\/admin\/locations(?:\/|$)/, roles: ["super_admin", "regional_officer"] },
  { pattern: /^\/admin\/limits(?:\/|$)/, roles: ["super_admin"] },
  { pattern: /^\/admin\/users(?:\/|$)/, roles: ["super_admin", "regional_officer"] },
  { pattern: /^\/citizen(?:\/|$)/, roles: ["citizen", "super_admin"] },
];

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  const rule = ROUTE_RULES.find((entry) => entry.pattern.test(pathname));
  if (!rule) {
    return role === "super_admin";
  }
  return rule.roles.includes(role);
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "citizen":
      return "/citizen";
    case "industry_user":
      return "/industries";
    case "monitoring_team":
      return "/monitoring/campaigns";
    case "regional_officer":
      return "/compliance";
    case "super_admin":
    default:
      return "/";
  }
}

export function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/unauthorized" || pathname.startsWith("/citizen");
}

export function isPublicApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/public/");
}

export function canRoleAccessApi(role: UserRole, apiPath: string): boolean {
  if (apiPath.startsWith("/api/auth/")) {
    return true;
  }

  if (apiPath.startsWith("/api/copilot")) {
    return role === "super_admin" || role === "regional_officer";
  }

  if (apiPath.startsWith("/api/air") || apiPath.startsWith("/api/water")) {
    return role !== "citizen";
  }

  if (apiPath.startsWith("/api/noise")) {
    return true;
  }

  return role === "super_admin";
}
