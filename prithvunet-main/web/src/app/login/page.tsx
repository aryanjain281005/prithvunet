"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

const DEMO_EMAILS: Array<{ role: UserRole; email: string }> = [
  { role: "super_admin", email: "rajesh@spcb.gov.in" },
  { role: "regional_officer", email: "priya@mpcb.gov.in" },
  { role: "monitoring_team", email: "arun@cpcb.gov.in" },
  { role: "industry_user", email: "vikram@tatasteel.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loadingAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login(email, password);

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Login failed");
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06080d] px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1118] p-7 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">PrithviNet Secure Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Role-Based Login</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Login with your CPCB role account to access only your assigned workflows.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Public users do not need login. Citizen complaints are available from the public portal.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-zinc-400">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white outline-none ring-0 transition-colors placeholder:text-zinc-500 focus:border-emerald-400/70"
              placeholder="name@agency.gov.in"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-zinc-400">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white outline-none ring-0 transition-colors placeholder:text-zinc-500 focus:border-emerald-400/70"
              placeholder="Enter your password"
            />
          </label>

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={submitting || loadingAuth}
            className="w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Demo Role Emails</p>
          <div className="mt-2 space-y-1.5">
            {DEMO_EMAILS.map((entry) => (
              <div key={entry.role} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-300">{ROLE_LABELS[entry.role]}</span>
                <span className="font-mono text-zinc-500">{entry.email}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Default password: ChangeMe123!</p>
        </div>
      </div>
    </div>
  );
}
