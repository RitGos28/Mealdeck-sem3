"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../../lib/logout";
import StudentShell from "./StudentShell";
import { PassportCard } from "./passport/PassportViews";

const ROLE_LABELS = { VENDOR: "Vendor", ADMIN: "Admin" };

function Chevron() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted"><path d="M9 6l6 6-6 6" /></svg>;
}

function Row({ href, children, hint }) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-mint/40">
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{children}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
        <Chevron />
      </Link>
    </li>
  );
}

// Logged-out visitors are sent to log in; StudentShell already knows who
// is signed in, so this just reads its user.
function RedirectToLogin({ router }) {
  useEffect(() => {
    router.replace("/login?next=/account");
  }, [router]);
  return <p className="py-10 text-center text-muted">Taking you to log in…</p>;
}

function AccountContent({ user, router }) {
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const dashboard = user.role === "VENDOR" ? "/vendor" : user.role === "ADMIN" ? "/admin" : null;

  async function handleLogout() {
    setLeaving(true);
    setError("");
    try {
      await logout(router, user.role);
    } catch {
      setError("Couldn't log out. Check your connection and try again.");
      setLeaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {user.role === "STUDENT" && <PassportCard />}
      <section aria-label="Signed in as" className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mint font-serif text-2xl text-mint-ink" aria-hidden="true">
          {user.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted">Signed in as</p>
          <p className="truncate font-semibold text-ink">{user.email}</p>
          {ROLE_LABELS[user.role] && <span className="mt-1 inline-block rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-mint-ink">{ROLE_LABELS[user.role]}</span>}
        </div>
      </section>

      {dashboard && (
        <Link href={dashboard} className="mt-6 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-deck px-4 py-3 font-semibold text-white hover:bg-deck-hover">
          Go to your {user.role === "VENDOR" ? "stall" : "admin"} dashboard
          <span aria-hidden="true">→</span>
        </Link>
      )}

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {/* Orders and the password reset (/api/auth/student/password-reset) are student-only. */}
        {!dashboard && <Row href="/orders" hint="Live status and past pre-orders">My orders</Row>}
        {!dashboard && <Row href="/login?mode=forgot" hint="We'll email you a code">Change password</Row>}
        <Row href="/privacy">How we use your details</Row>
      </ul>

      <button type="button" onClick={handleLogout} disabled={leaving} className="mt-8 flex h-12 w-full items-center justify-center rounded-full border border-field font-semibold text-ink hover:border-deck disabled:opacity-60">
        {leaving ? "Logging out…" : "Log out"}
      </button>
      {error && <p role="alert" className="mt-3 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function AccountView() {
  const router = useRouter();

  const band = (
    <div className="mt-5">
      <h1 className="font-serif text-3xl leading-tight">Account</h1>
      <p className="mt-1 text-sm text-on-deck">Your login, orders and privacy</p>
    </div>
  );

  return (
    <StudentShell active="account" band={band}>
      {(user) => {
        if (user === undefined) return <p className="py-10 text-center text-muted" role="status">Loading your account…</p>;
        if (user === null) return <RedirectToLogin router={router} />;
        return <AccountContent user={user} router={router} />;
      }}
    </StudentShell>
  );
}
