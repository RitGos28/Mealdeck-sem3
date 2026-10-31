"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentShell from "../StudentShell";
import { PassportHome, StallStamps, usePassport } from "./PassportViews";

function Back({ href, label }) {
  return (
    <Link href={href} className="-ml-1 flex min-h-10 w-fit items-center gap-1 rounded-lg px-1 text-sm text-[#D6EBDC] hover:text-white focus-visible:outline-white">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>{label}
    </Link>
  );
}

function Chip({ children }) {
  return <span className="rounded-full bg-white/10 px-2.5 py-1 text-[13px] text-on-deck">{children}</span>;
}

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?next=/account/passport");
  }, [router]);
  return <p className="py-10 text-center text-muted">Taking you to log in…</p>;
}

// /account/passport, and one stall's stamps at /account/passport?stall=6.
export default function PassportPage({ stallId }) {
  const passport = usePassport();
  const ready = passport && !passport.error;
  const entry = ready && stallId ? passport.perStall.find(({ stall }) => String(stall.id) === String(stallId)) : null;

  let band;
  const owner = (user) => {
    const first = user?.name?.trim().split(/\s+/)[0];
    return first ? `${first}'s food passport` : "Your food passport";
  };
  if (entry) {
    const stamped = entry.sections.filter((section) => section.tried > 0).length;
    band = (
      <div className="mt-2">
        <Back href="/account/passport" label="Passport" />
        <h1 className="font-serif text-3xl leading-tight">{entry.stall.name}</h1>
        <p className="mt-1 text-sm text-on-deck">{entry.tried} of {entry.total} tried · {stamped} of {entry.sections.length} sections stamped</p>
      </div>
    );
  } else {
    band = (user) => (
      <div className="mt-2">
        <Back href="/account" label="Account" />
        <h1 className="font-serif text-3xl leading-tight">{owner(user)}</h1>
        <p className="mt-1 text-sm text-on-deck">{ready ? `${passport.triedCount} of ${passport.total} campus dishes tried` : "Every dish you pick up gets a stamp"}</p>
        {ready && (
          <>
            <span aria-hidden="true" className="mt-3 block h-2 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${Math.max(2, Math.round((passport.triedCount / Math.max(1, passport.total)) * 100))}%` }} /></span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>{passport.newThisMonth} new this month</Chip>
              <Chip>{passport.stallsStamped} of {passport.perStall.length} stalls stamped</Chip>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <StudentShell active="account" band={band}>
      {(user) => {
        if (user === null) return <RedirectToLogin />;
        if (passport?.error) return <p role="alert" className="rounded-2xl bg-[#fbe9e7] px-4 py-3 text-sm text-danger">Couldn&apos;t load your passport. Refresh to try again.</p>;
        if (!ready || user === undefined) return <p role="status" className="py-10 text-center text-muted">Loading your passport…</p>;
        if (stallId && !entry) return <p className="py-10 text-center text-muted">That stall isn&apos;t on campus any more. <Link href="/account/passport" className="font-semibold text-deck underline">Back to your passport</Link></p>;
        return (
          <div className="mx-auto max-w-3xl">
            {entry ? <StallStamps entry={entry} /> : <PassportHome passport={passport} />}
            <p className="mt-6 text-[13px] text-muted">A dish gets its stamp when the stall marks your order picked up.</p>
          </div>
        );
      }}
    </StudentShell>
  );
}
