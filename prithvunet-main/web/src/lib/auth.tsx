"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { UserRole } from "./types";
import { AuthUser, ROLE_COLORS, ROLE_LABELS } from "@/lib/rbac";

type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoggedIn: boolean;
  loadingAuth: boolean;
  roleLabel: string;
  roleColor: string;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const role = user?.role ?? null;

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }

      const payload = (await response.json()) as { user: AuthUser | null };
      setUser(payload.user);
    } catch {
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { user?: AuthUser; error?: string };

      if (!response.ok || !payload.user) {
        return { ok: false, error: payload.error || "Invalid credentials" };
      }

      setUser(payload.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Unable to reach authentication service" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const hasAccess = useCallback(
    (allowedRoles: UserRole[]) => {
      if (!role) {
        return false;
      }
      return allowedRoles.includes(role);
    },
    [role],
  );

  const roleLabel = useMemo(() => (role ? ROLE_LABELS[role] : "Guest"), [role]);
  const roleColor = useMemo(
    () => (role ? ROLE_COLORS[role] : "bg-zinc-700/40 text-zinc-300"),
    [role],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        login,
        logout,
        refreshSession,
        isLoggedIn: user !== null,
        loadingAuth,
        roleLabel,
        roleColor,
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
