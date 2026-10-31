"use client";

import Link from "next/link";
import StudentShell from "./StudentShell";
import { DeleteAccountPanel, WhatYouLose } from "./AccountDeletion";

const CONTACT = "ritwik@mealdeck.in";

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-mint-ink">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

// /account/deletion: public, so anyone (and Google Play's review) can read
// how deletion works without logging in. A logged-in student also gets the
// delete / cancel controls here.
export default function DeletionPage() {
  const band = (
    <div className="mt-5">
      <h1 className="font-serif text-3xl leading-tight">Delete your MealDeck account</h1>
      <p className="mt-1 text-sm text-on-deck">How it works, what&apos;s deleted and what&apos;s kept</p>
    </div>
  );

  return (
    <StudentShell active="account" band={band}>
      {(user, deletion) => (
        <div className="mx-auto max-w-2xl space-y-8 text-[15px] leading-relaxed text-ink">
          {user?.role === "STUDENT" && <DeleteAccountPanel deletion={deletion} />}

          <section>
            <h2 className="mb-3 font-serif text-2xl">How to delete your account</h2>
            <ol className="space-y-3">
              <Step n="1">Log in to MealDeck (the app or mealdeck.in) with your Bennett email.</Step>
              <Step n="2">Open <strong>Account</strong> and tap <strong>Delete my account</strong> at the bottom, or use the button at the top of this page.</Step>
              <Step n="3">Read what you&apos;ll lose, type <strong>CONFIRM</strong>, enter your password and confirm.</Step>
              <Step n="4">Your account is deleted for good <strong>24 hours later</strong>. Until then you can cancel from the same place and nothing is lost. In the last hour, the account can&apos;t place orders.</Step>
            </ol>
            {user === null && <Link href="/login?next=/account/deletion" className="mt-4 inline-flex h-12 items-center rounded-full bg-deck px-6 font-semibold text-white hover:bg-deck-hover">Log in to delete your account</Link>}
            <p className="mt-4 text-sm text-muted">Can&apos;t log in? Email <a href={`mailto:${CONTACT}?subject=Delete%20my%20MealDeck%20account`} className="font-semibold text-deck underline">{CONTACT}</a> from your Bennett address and we&apos;ll delete it for you. You can&apos;t delete an account while one of its orders is still being prepared: pick it up first.</p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl">What&apos;s deleted</h2>
            <WhatYouLose />
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl">What&apos;s kept, and for how long</h2>
            <p>The orders you placed stay on the stalls&apos; records, so their sales and stock still add up: the items, prices, pickup time and order number. They&apos;re <strong>anonymised</strong> when your account is deleted. Your name and contact details are removed from them, and they&apos;re no longer linked to you. Nothing else is kept.</p>
          </section>

          <p className="text-sm text-muted">More in our <Link href="/privacy" className="font-semibold text-deck underline">privacy notice</Link>. MealDeck is an independent student project, not an official Bennett University service.</p>
        </div>
      )}
    </StudentShell>
  );
}
