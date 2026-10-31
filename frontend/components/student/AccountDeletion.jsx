"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDeletionTime } from "../../lib/useAccountDeletion";

// Everything a student loses by deleting their account, shown in bold
// before they can confirm.
const LOSSES = [
  "Pre-ordering from every campus stall, and skipping the queue",
  "My orders: live order status, order numbers and your whole order history",
  "Order again shortcuts built from what you've ordered before",
  "Your Food passport: every stamp, your progress and your “next to try” picks",
  "Any Deal me a dish hand you're in the middle of",
  "The out-of-stock reports you've made",
  "Your saved name, phone number, email login and password",
  "Sign-in and password-reset emails to this address",
];

export function WhatYouLose() {
  return (
    <div className="space-y-3 text-sm text-ink">
      <p>
        <strong>Deleting your account means you can&apos;t use mealdeck.in or any of its related services, including the MealDeck Android app, until you create a new account.</strong>{" "}
        You will lose, including but not limited to:
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        {LOSSES.map((loss) => <li key={loss}><strong>{loss}</strong></li>)}
      </ul>
      <p><strong>A new account starts from zero.</strong> Your stamps and order history don&apos;t come back if you sign up again.</p>
      <p className="text-muted">Orders you&apos;ve already placed stay on the stalls&apos; records so their sales add up, but anonymised: your name and contact are removed from them.</p>
    </div>
  );
}

// "24 hours" (or minutes, for a shorter test setting).
function graceText(minutes = 1440) {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `${minutes} minutes`;
}

// Asking to delete (with CONFIRM and the password), or, once asked, when
// it happens and the button to cancel.
export function DeleteAccountPanel({ deletion }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = deletion.status;

  if (status?.scheduledFor) {
    return (
      <section aria-labelledby="deletion-heading" className="rounded-2xl border-2 border-danger/40 bg-[#FBEDE6] p-4">
        <h2 id="deletion-heading" className="font-serif text-xl text-danger">Your account is scheduled for deletion</h2>
        <p className="mt-1 text-sm text-ink">It will be deleted for good at <strong>{formatDeletionTime(status.scheduledFor)}</strong>.{" "}
          {status.orderingBlocked ? <strong>It can&apos;t place orders any more.</strong> : <>You can still order until {formatDeletionTime(status.orderingBlockedFrom)}, for pickups before then.</>}
        </p>
        <p className="mt-1 text-sm text-muted">Changed your mind? Cancel any time before then and nothing is lost.</p>
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await deletion.cancel(); } catch (err) { setError(err.message); } finally { setBusy(false); } }} className="mt-3 h-12 rounded-full bg-deck px-6 font-semibold text-white hover:bg-deck-hover disabled:opacity-60">
          {busy ? "Cancelling…" : "Cancel deletion, keep my account"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      </section>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-full items-center justify-center rounded-full border border-danger/50 font-semibold text-danger hover:bg-[#FBEDE6]">
        Delete my account
      </button>
    );
  }

  const ready = confirmText === "CONFIRM" && password.length > 0;
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!ready) return;
        setBusy(true);
        setError("");
        try {
          await deletion.request(password);
          setPassword("");
          setConfirmText("");
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-4 rounded-2xl border-2 border-danger/40 bg-white p-4"
    >
      <h2 className="font-serif text-xl text-danger">Delete your account?</h2>
      <WhatYouLose />
      <p className="text-sm text-ink">Your account is deleted <strong>{graceText(deletion.status?.graceMinutes)}</strong> after you confirm. Until then you can cancel from here and nothing is lost. In the last hour, the account can&apos;t place orders.</p>
      <label className="block text-sm">
        <span className="font-semibold">Type <span className="font-mono">CONFIRM</span> to continue</span>
        <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} className="mt-1 h-12 w-full rounded-xl border border-field px-3 font-mono outline-none focus:border-danger" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">Your password</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 h-12 w-full rounded-xl border border-field px-3 outline-none focus:border-danger" />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!ready || busy} className="h-12 rounded-full bg-danger px-6 font-semibold text-white disabled:opacity-40">
          {busy ? "Scheduling…" : "Delete my account"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setConfirmText(""); setPassword(""); setError(""); }} className="h-12 rounded-full border border-field px-6 font-semibold text-ink hover:border-deck">Keep my account</button>
      </div>
    </form>
  );
}

// Across every student page while a deletion is pending: a banner, and in
// the final hour a slow red pulse around the screen plus, once per visit,
// a full-screen notice.
export function DeletionWarnings({ deletion }) {
  const status = deletion.status;
  const finalHour = Boolean(status?.orderingBlocked);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    if (!finalHour) return;
    try {
      if (sessionStorage.getItem("mealdeck.deletionNotice")) return;
      sessionStorage.setItem("mealdeck.deletionNotice", "1");
    } catch {
      // No storage: show it anyway.
    }
    setNoticeOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [finalHour]);

  if (!status?.scheduledFor) return null;
  return (
    <>
      <div role="status" className={`px-5 py-2.5 text-center text-sm font-semibold sm:px-8 ${finalHour ? "bg-danger text-white" : "bg-[#FBEDE6] text-danger"}`}>
        {finalHour
          ? <>This account is scheduled for deletion at {formatDeletionTime(status.scheduledFor)} and can&apos;t order. </>
          : <>Your account will be deleted at {formatDeletionTime(status.scheduledFor)}. </>}
        <Link href="/account/deletion" className="underline underline-offset-2">{finalHour ? "Read more" : "Cancel deletion"}</Link>
      </div>
      {finalHour && <div aria-hidden="true" className="deletion-pulse pointer-events-none fixed inset-0 z-50" />}
      {finalHour && noticeOpen && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="deletion-notice-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2A0D08]/70 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center text-ink shadow-2xl">
            <p className="text-xs font-semibold tracking-[.06em] text-danger uppercase">Account deletion</p>
            <h2 id="deletion-notice-title" className="mt-2 font-serif text-2xl leading-tight">This account is scheduled for deletion and cannot order</h2>
            <p className="mt-2 text-sm text-muted">It will be deleted for good at {formatDeletionTime(status.scheduledFor)}. Please read more at <Link href="/account/deletion" className="font-semibold text-deck underline">mealdeck.in/account/deletion</Link>.</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button type="button" onClick={async () => { await deletion.cancel(); setNoticeOpen(false); }} className="h-12 rounded-full bg-deck font-semibold text-white hover:bg-deck-hover">Cancel deletion</button>
              <button type="button" onClick={() => setNoticeOpen(false)} className="h-12 rounded-full border border-field font-semibold hover:border-deck">OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
