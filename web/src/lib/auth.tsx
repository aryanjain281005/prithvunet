"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { UserRole } from "./types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  avatar: string;
}

const DEMO_USERS: Record<UserRole, AuthUser> = {
  super_admin: { id: "U001", name: "Dr. Rajesh Kumar", email: "rajesh@spcb.gov.in", role: "super_admin", region: "All India", avatar: "SA" },
  regional_officer: { id: "U002", name: "Priya Sharma", email: "priya@mpcb.gov.in", role: "regional_officer", region: "Maharashtra", avatar: "RO" },
  monitoring_team: { id: "U003", name: "Arun Patel", email: "arun@cpcb.gov.in", role: "monitoring_team", region: "Gujarat", avatar: "MT" },
  industry_user: { id: "U004", name: "Vikram Singh", email: "vikram@tatasteel.com", role: "industry_user", region: "Jharkhand", avatar: "IU" },
  citizen: { id: "U005", name: "Ananya Gupta", email: "ananya@gmail.com", role: "citizen", region: "Delhi", avatar: "CZ" },
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin (State HQ)",
  regional_officer: "Regional Officer",
  monitoring_team: "Monitoring Team",
  industry_user: "Industry User",
  citizen: "Citizen",
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-500/20 text-purple-400",
  regional_officer: "bg-blue-500/20 text-blue-400",
  monitoring_team: "bg-green-500/20 text-green-400",
  industry_user: "bg-orange-500/20 text-orange-400",
  citizen: "bg-cyan-500/20 text-cyan-400",
};

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  isLoggedIn: boolean;
  roleLabel: string;
  roleColor: string;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_USERS.super_admin);
  const [role, setRoleState] = useState<UserRole>("super_admin");

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setUser(DEMO_USERS[newRole]);
  };

  const login = (selectedRole: UserRole) => {
    setRole(selectedRole);
  };

  const logout = () => {
    setUser(null);
    setRoleState("citizen");
  };

  const hasAccess = (allowedRoles: UserRole[]) => {
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        logout,
        isLoggedIn: user !== null,
        roleLabel: ROLE_LABELS[role],
        roleColor: ROLE_COLORS[role],
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ROLE_LABELS, ROLE_COLORS, DEMO_USERS };
