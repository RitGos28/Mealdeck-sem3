"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { castVote, soldOutTimes, useMyVotes, useStore, voteCounts } from "../../lib/dishSignals";
import { formatTime } from "../../lib/api";

// "Often sold out by 2:00 PM (6 of the last 28 days)", learned from sold-out
// reports (SoldOutService). For a dish with sizes, the size that sells out
// most often speaks for it. Nothing until a dish has run out on enough days.
export function SoldOutHint({ itemIds, className = "" }) {
  const times = useStore(soldOutTimes);
  const best = times.filter((t) => itemIds.includes(t.menuItemId)).sort((a, b) => b.days - a.days)[0];
  if (!best) return null;
  return (
    <p className={`text-xs text-[#9A5B00] ${className}`}>
      Often sold out by {formatTime(best.usually)} <span className="text-muted">({best.days} of the last {best.windowDays} days)</span>
    </p>
  );
}

// Totals across a dish's sizes, e.g. "12 say amazing · 2 not worth it".
// Nothing until someone has voted.
export function VoteSummary({ itemIds, className = "" }) {
  const counts = useStore(voteCounts);
  let amazing = 0;
  let notWorthIt = 0;
  for (const id of itemIds) {
    amazing += counts[id]?.amazing ?? 0;
    notWorthIt += counts[id]?.notWorthIt ?? 0;
  }
  if (amazing + notWorthIt === 0) return null;
  const parts = [];
  if (amazing) parts.push(`${amazing} say amazing`);
  if (notWorthIt) parts.push(`${notWorthIt} not worth it`);
  return <p className={`text-xs text-mint-ink ${className}`}>{parts.join(" · ")}</p>;
}

// "Had this? Amazing / Not worth it." Any logged-in student can vote once
// per dish (tap your choice again to take it back); others are sent to log
// in. Only totals are ever shown, never who voted.
export function VoteButtons({ item, user }) {
  const router = useRouter();
  const isStudent = user?.role === "STUDENT";
  const mine = useMyVotes(isStudent);
  const current = mine?.votes?.[item.id];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function choose(amazing) {
    if (!isStudent) {
      router.push("/login?next=/");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const vote = current === amazing ? null : amazing ? "AMAZING" : "NOT_WORTH_IT";
      await castVote(item.id, vote);
    } catch (err) {
      setError(err.status === 401 || err.status === 403 ? "Log in as a student to vote." : err.message);
    } finally {
      setSaving(false);
    }
  }

  const button = (amazing, label) => (
    <button
      type="button"
      aria-pressed={current === amazing}
      disabled={saving}
      onClick={() => choose(amazing)}
      className={`h-10 flex-1 rounded-full text-sm transition-colors disabled:opacity-60 ${current === amazing ? "bg-deck font-semibold text-white" : "border border-field font-medium text-ink hover:border-deck"}`}
    >
      {label}
    </button>
  );

  return (
    <section aria-label={`Rate ${item.name}`}>
      <h3 className="mb-2 text-sm font-semibold">Had this?</h3>
      <div className="flex gap-2">
        {button(true, "Amazing")}
        {button(false, "Not worth it")}
      </div>
      <VoteSummary itemIds={[item.id]} className="mt-2" />
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </section>
  );
}
