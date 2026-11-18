"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function Bars({ question, total }) {
  return (
    <div className="rounded-2xl border border-[#e1e8dd] bg-white p-4">
      <h3 className="mb-3 font-display text-base font-bold leading-snug">{question.title}</h3>
      <ul className="space-y-2">
        {question.counts.map((option) => (
          <li key={option.key} className="text-sm">
            <div className="flex justify-between gap-3"><span>{option.label}</span><span className="font-semibold tabular-nums">{option.count}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eef3ea]"><div className="h-full rounded-full bg-[#477355]" style={{ width: `${total ? Math.round((option.count / total) * 100) : 0}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// What students said in the Account questionnaire: a bar chart per
// multiple-choice question and the written answers, newest first, without who
// wrote them. The numbers are "among the N students who answered", not all students.
export default function SurveyAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/api/admin/survey").then(setData, (err) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="mb-5"><h2 className="font-display text-2xl font-bold">Student questionnaire</h2><p className="mt-1 text-sm text-gray-500">Answers to the questions in Account. Optional, editable by the student, and shown here without names.</p></div>
      {error && <p className="mb-4 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
      {!data ? <p className="text-sm text-gray-500">Loading…</p> : data.responses === 0 ? <p className="text-sm text-gray-500">No answers yet.</p> : (
        <>
          <p className="mb-1 text-sm font-semibold">{data.responses} {data.responses === 1 ? "student has" : "students have"} answered.</p>
          <p className="mb-4 text-xs text-gray-500">Quote these as &ldquo;among {data.responses} app users&rdquo;, not &ldquo;X% of students&rdquo;: only people who have the app and chose to answer are counted.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.questions.map((question) => <Bars key={question.id} question={question} total={data.responses} />)}
          </div>
          <h3 className="mt-7 mb-3 font-display text-lg font-bold">In their words</h3>
          <ul className="divide-y divide-[#edf1ea] rounded-2xl border border-[#e1e8dd] bg-white shadow-sm">
            {data.comments.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No written answers yet.</li>}
            {data.comments.map((comment, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="w-28 shrink-0 text-xs text-gray-500">{new Date(comment.at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}</span>
                <span className="max-w-[14rem] shrink-0 rounded-full bg-[#eef5ea] px-2.5 py-0.5 text-xs font-semibold text-[#315c3d]">{comment.about}</span>
                <span className="min-w-0 flex-1">{comment.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
