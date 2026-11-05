"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const SOURCE_LABELS = { friend: "A friend", whatsapp: "A WhatsApp group", poster: "A poster or QR code", social: "Instagram or other social media", hatchery: "Hatchery", other: "Somewhere else" };
const FEATURE_LABELS = { menus: "Menus and prices in one place", veg: "Veg filter and diet setting", deal: "Deal me a dish", mess: "Mess today", reports: "Out-of-stock reports", passport: "Food passport", preorders: "The idea of pre-ordering", other: "Something else" };

function Bars({ title, counts, labels, total }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl border border-[#e1e8dd] bg-white p-4">
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      <ul className="space-y-2">
        {rows.map(([key, count]) => (
          <li key={key} className="text-sm">
            <div className="flex justify-between gap-3"><span>{labels[key] ?? key}</span><span className="font-semibold tabular-nums">{count}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eef3ea]"><div className="h-full rounded-full bg-[#477355]" style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// What students said in the Account questionnaire: totals per option and the
// written answers, newest first, without who wrote them.
export default function SurveyAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/api/admin/survey").then(setData, (err) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="mb-5"><h2 className="font-display text-2xl font-bold">Student questionnaire</h2><p className="mt-1 text-sm text-gray-500">Answers to the four questions in Account. Optional, editable by the student, and shown here without names.</p></div>
      {error && <p className="mb-4 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
      {!data ? <p className="text-sm text-gray-500">Loading…</p> : data.responses === 0 ? <p className="text-sm text-gray-500">No answers yet.</p> : (
        <>
          <p className="mb-4 text-sm font-semibold">{data.responses} {data.responses === 1 ? "student has" : "students have"} answered.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Bars title="Where they heard about us" counts={data.sources} labels={SOURCE_LABELS} total={data.responses} />
            <Bars title="What convinced them" counts={data.features} labels={FEATURE_LABELS} total={data.responses} />
          </div>
          <h3 className="mt-7 mb-3 font-display text-lg font-bold">In their words</h3>
          <ul className="divide-y divide-[#edf1ea] rounded-2xl border border-[#e1e8dd] bg-white shadow-sm">
            {data.comments.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No written answers yet.</li>}
            {data.comments.map((comment, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="w-28 shrink-0 text-xs text-gray-500">{new Date(comment.at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}</span>
                <span className="shrink-0 rounded-full bg-[#eef5ea] px-2.5 py-0.5 text-xs font-semibold text-[#315c3d]">{comment.about}</span>
                <span className="min-w-0 flex-1">{comment.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
