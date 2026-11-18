"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

const LABELS = {
  ACCOUNT_CREATED: "Sign-up",
  OUT_OF_STOCK_REPORTED: "Out of stock",
  PREORDER_PLACED: "Pre-order",
  DELETION_REQUESTED: "Deletion asked",
  DELETION_CANCELLED: "Deletion cancelled",
  ACCOUNT_DELETED: "Deleted for good",
};

function when(value) {
  return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// The activity trail (see ActivityLog in the backend): ids only, kept for a
// year or until cleared here.
export default function ActivityView() {
  const [lines, setLines] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(async (id) => {
    try {
      const query = id ? `?studentId=${encodeURIComponent(id)}` : "";
      setLines(await api(`/api/admin/activity${query}`)); setError(null);
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(""); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function clear() {
    if (!window.confirm("Clear the whole activity log? This cannot be undone.")) return;
    try { await api("/api/admin/activity", { method: "DELETE" }); await load(studentId.trim()); } catch (err) { setError(err.message); }
  }

  return <section>
    <div className="mb-5"><h2 className="font-display text-2xl font-bold">Activity log</h2><p className="mt-1 text-sm text-gray-500">Sign-ups, out-of-stock reports, pre-orders and account deletions, by student number only. Lines are kept for a year, or until you clear them, even after an account is deleted.</p></div>
    {error && <p className="mb-4 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
    <form onSubmit={(e) => { e.preventDefault(); load(studentId.trim()); }} className="mb-5 flex flex-wrap items-center gap-2">
      <input value={studentId} onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Student number (all if empty)" aria-label="Student number" className="w-60 rounded-xl border border-[#e0e8dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#477355] focus:ring-2 focus:ring-[#dbead6]" />
      <button className="rounded-xl bg-[#173725] px-3 py-2 text-sm font-semibold text-white hover:bg-[#28543a]">Show</button>
      <button type="button" onClick={() => { setStudentId(""); load(""); }} className="rounded-xl border border-[#d8e2d5] px-3 py-2 text-sm font-semibold text-[#315c3d] hover:bg-[#f3f7f1]">Latest 200</button>
      <button type="button" onClick={clear} className="ml-auto rounded-xl border border-[#e8c9c2] px-3 py-2 text-sm font-semibold text-[#9a4a3f] hover:bg-[#fbe9e7]">Clear log</button>
    </form>
    {lines === null ? <p className="text-sm text-gray-500">Loading…</p> : lines.length === 0 ? <p className="text-sm text-gray-500">Nothing logged yet.</p> :
      <ul className="divide-y divide-[#edf1ea] rounded-2xl border border-[#e1e8dd] bg-white shadow-sm">
        {lines.map((line) => <li key={line.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
          <span className="w-28 shrink-0 text-xs text-gray-500">{when(line.at)}</span>
          <span className="shrink-0 rounded-full bg-[#eef5ea] px-2.5 py-0.5 text-xs font-semibold text-[#315c3d]">{LABELS[line.type] ?? line.type}</span>
          <span className="min-w-0 flex-1">{line.text}</span>
        </li>)}
      </ul>}
  </section>;
}
