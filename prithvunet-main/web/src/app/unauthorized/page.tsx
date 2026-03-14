import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06080d] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-red-400">Access Denied</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">You are not allowed to access this module</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Your account role does not include permission for this page. Contact your CPCB admin if this is unexpected.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
