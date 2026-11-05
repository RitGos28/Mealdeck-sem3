"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import StudentShell from "../StudentShell";

const textarea = "w-full rounded-xl border border-field bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-deck focus:ring-2 focus:ring-mint";

function Back() {
  return (
    <Link href="/account" className="-ml-1 flex min-h-10 w-fit items-center gap-1 rounded-lg px-1 text-sm text-[#D6EBDC] hover:text-white focus-visible:outline-white">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Account
    </Link>
  );
}

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?next=/account/survey");
  }, [router]);
  return <p className="py-10 text-center text-muted">Taking you to log in…</p>;
}

function Question({ number, title, hint, children }) {
  return (
    <fieldset className="mt-7 first:mt-0">
      <legend className="font-serif text-xl leading-snug"><span className="text-muted">{number}. </span>{title}</legend>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3 space-y-1.5">{children}</div>
    </fieldset>
  );
}

function Choice({ type, name, checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-[#F6F8F5]">
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[#163D29]" />
      <span className="text-[15px]">{children}</span>
    </label>
  );
}

// The questionnaire: the questions come from the server (so they can change
// there without touching this page). Every question is optional, answers can
// be changed later, and they are removed with the account.
function SurveyForm() {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [state, setState] = useState("idle"); // idle | saving | saved
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/account/survey").then(
      (data) => {
        if (!active) return;
        setForm(data);
        setAnswers(data.mine?.answers ?? {});
      },
      (err) => active && setError(err.message),
    );
    return () => { active = false; };
  }, []);

  // After a save, a moment to read "Thank you", then back to Account.
  useEffect(() => {
    if (state !== "saved") return undefined;
    const timer = setTimeout(() => router.push("/account"), 1400);
    return () => clearTimeout(timer);
  }, [state, router]);

  if (!form) {
    return error
      ? <p role="alert" className="rounded-2xl bg-[#fbe9e7] px-4 py-3 text-sm text-danger">Couldn&apos;t load the questions. Refresh to try again.</p>
      : <div role="status" className="space-y-4 py-2"><span className="sr-only">Loading…</span>{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F1F4F0]" />)}</div>;
  }

  const set = (patch) => { setAnswers((current) => ({ ...current, ...patch })); setState("idle"); };
  const toggle = (id, key) => {
    const picked = answers[id] ?? [];
    set({ [id]: picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key] });
  };

  async function submit(event) {
    event.preventDefault();
    setState("saving");
    setError("");
    try {
      await api("/api/account/survey", { method: "PUT", body: answers });
      setState("saved");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl">
      <p className="mb-6 text-sm text-muted">Every question is optional, and you can change your answers any time. We read these to decide what to build next. Admins see totals and your written words, but not who wrote them.</p>

      {form.questions.map((question, index) => {
        const value = answers[question.id];
        const otherChosen = question.allowOther && (question.type === "MULTI" ? (value ?? []).includes("other") : value === "other");
        return (
          <Question key={question.id} number={index + 1} title={question.title} hint={question.hint}>
            {question.type === "TEXT" && (
              <textarea value={value ?? ""} onChange={(e) => set({ [question.id]: e.target.value })} maxLength={600} rows={3} aria-label={question.title} className={textarea} />
            )}
            {question.type === "SINGLE" && question.options.map((option) => (
              <Choice key={option.key} type="radio" name={question.id} checked={value === option.key} onChange={() => set({ [question.id]: option.key })}>{option.label}</Choice>
            ))}
            {question.type === "MULTI" && question.options.map((option) => (
              <Choice key={option.key} type="checkbox" name={question.id} checked={(value ?? []).includes(option.key)} onChange={() => toggle(question.id, option.key)}>{option.label}</Choice>
            ))}
            {otherChosen && (
              <input value={answers[`${question.id}Other`] ?? ""} onChange={(e) => set({ [`${question.id}Other`]: e.target.value })} maxLength={120} placeholder="Tell us more" aria-label={`${question.title} (other)`} className={`${textarea} ml-9 w-[calc(100%-2.25rem)]`} />
            )}
          </Question>
        );
      })}

      {error && <p role="alert" className="mt-5 rounded-xl bg-[#FBEDE6] px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button disabled={state === "saving" || state === "saved"} className="h-12 rounded-full bg-deck px-7 font-semibold text-white hover:bg-deck-hover disabled:opacity-50">{state === "saving" ? "Saving…" : form.mine ? "Update my answers" : "Send my answers"}</button>
        {state === "saved" && <span role="status" className="text-sm font-semibold text-mint-ink">Thank you. Saved ✓ Taking you back to Account…</span>}
      </div>
    </form>
  );
}

// /account/survey
export default function SurveyPage() {
  const band = (
    <div className="mt-2">
      <Back />
      <h1 className="font-serif text-3xl leading-tight">A few quick questions</h1>
      <p className="mt-1 text-sm text-on-deck">Help us build the right thing</p>
    </div>
  );
  return (
    <StudentShell active="account" band={band}>
      {(user) => (user === null ? <RedirectToLogin /> : user === undefined ? <p role="status" className="py-10 text-center text-muted">Loading…</p> : user.role === "STUDENT" ? <SurveyForm /> : <p className="py-10 text-center text-muted">The questions are for student accounts.</p>)}
    </StudentShell>
  );
}
