"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatInstant } from "../../../lib/api";
import { HIDE_PRICE, priceText } from "../../../lib/mess";
import BagSheet from "../../BagSheet";
import StudentShell from "../StudentShell";
import MessScreenshotImport from "./MessScreenshotImport";

function Back() {
  return (
    <Link href="/" className="-ml-1 flex min-h-10 w-fit items-center gap-1 rounded-lg px-1 text-sm text-[#D6EBDC] hover:text-white focus-visible:outline-white">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Menu
    </Link>
  );
}

// The add form and the "isn't correct" form are the same box: a list of
// dishes. The flag form starts from what's there now.
function MealForm({ meal, flag, initialText = "", onClose, onSaved }) {
  const router = useRouter();
  const [text, setText] = useState(flag ? meal.items.join(", ") : initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const name = meal.label.toLowerCase();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (flag) await api(`/api/mess/today/${meal.meal}/flags`, { method: "POST", body: { correction: text } });
      else await api(`/api/mess/today/${meal.meal}`, { method: "POST", body: { items: text } });
      await onSaved();
      onClose();
    } catch (err) {
      if (err.status === 401 || err.status === 403) { router.push("/login?next=/mess"); return; }
      setError(err.message);
      if (err.status === 409) await onSaved();
      setSaving(false);
    }
  }

  return (
    <BagSheet onClose={onClose} label={flag ? `Correct ${name}` : `Add ${name}`}>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-serif text-2xl">{flag ? `What is today's ${name} really?` : `Add today's ${name}`}</h2>
        <p className="text-sm text-muted">
          {flag ? "Write the dishes as they should be, separated by commas. When 3 different students agree it's wrong, the most common correction replaces the menu." : "List the dishes, separated by commas. Copy them as you see them, and nothing else: no links."}
        </p>
        <label htmlFor="mess-dishes" className="sr-only">Dishes</label>
        <textarea
          id="mess-dishes"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          maxLength={800}
          required
          placeholder="e.g. Rajma, jeera rice, aloo gobi, roti, salad"
          className="w-full rounded-xl border border-field bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-deck focus:ring-2 focus:ring-mint"
        />
        {error && <p role="alert" className="rounded-xl bg-[#FBEDE6] px-3 py-2.5 text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button disabled={saving || !text.trim()} className="h-12 flex-1 rounded-full bg-deck font-semibold text-white hover:bg-deck-hover disabled:opacity-50">{saving ? "Saving…" : flag ? "Send correction" : "Add menu"}</button>
          <button type="button" onClick={onClose} className="h-12 rounded-full border border-field px-5 font-semibold text-ink hover:bg-[#F4F6F3]">Cancel</button>
        </div>
      </form>
    </BagSheet>
  );
}

// prediction: { dishes, weeksSeen } from /api/mess/predicted, a guess from
// the same weekday in past weeks, for a meal nobody has added yet.
function MealRow({ meal, prediction, weekday, onAdd, onFlag }) {
  const added = meal.items.length > 0;
  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl">{meal.label}</h2>
        {!HIDE_PRICE && <span className="text-xs text-muted">{priceText(meal.priceInr)}</span>}
      </div>
      <p className={`mt-1 text-[15px] ${added ? "" : "text-muted"}`}>{added ? meal.items.join(", ") : "Not added yet"}</p>
      {!added && prediction && (
        <div className="mt-2 rounded-xl border border-dashed border-field px-3 py-2">
          <p className="text-[14px] text-ink"><span className="font-semibold">Probably:</span> {prediction.dishes.join(", ")}</p>
          <p className="text-xs text-muted">A guess from {weekday ? `the last ${prediction.weeksSeen} ${weekday}s` : "past weeks"}, not today&apos;s confirmed menu.</p>
          <button type="button" onClick={() => onAdd(meal, prediction.dishes.join(", "))} className="mt-1 min-h-9 text-[13px] font-semibold text-deck hover:underline">Looks right? Check it and add it</button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        {added ? (
          <>
            <span className="text-muted">{meal.confirmed ? "Checked ✓" : "Added by a student"} · {formatInstant(meal.addedAt)}</span>
            {!meal.confirmed && !meal.locked && (meal.youAdded
              ? <span className="font-semibold text-muted">You added this</span>
              : meal.youFlagged
                ? <span className="font-semibold text-muted">You said this isn&apos;t correct</span>
                : <button type="button" onClick={() => onFlag(meal)} className="min-h-9 font-semibold text-deck hover:underline">This isn&apos;t correct</button>)}
          </>
        ) : (
          <button type="button" onClick={() => onAdd(meal)} className="min-h-9 font-semibold text-deck hover:underline">+ Add today&apos;s {meal.label.toLowerCase()}</button>
        )}
      </div>
    </li>
  );
}

// /mess: what the campus mess is serving today, written by students.
// Anyone can read it; adding or correcting a menu needs a student login.
export default function MessPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(null); // { meal, flag, initialText }
  const [predicted, setPredicted] = useState([]);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/mess/today"));
      setError(false);
    } catch {
      setError(true);
    }
    // The guesses are extra: if they don't load, the page works without them.
    api("/api/mess/predicted").then((result) => setPredicted(Array.isArray(result) ? result : []), () => setPredicted([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const day = data ? new Date(`${data.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : "";
  const band = (
    <div className="mt-2">
      <Back />
      <h1 className="font-serif text-3xl leading-tight">Mess today</h1>
      <p className="mt-1 text-sm text-on-deck">{day ? `${day} · ` : ""}menu added by students</p>
    </div>
  );

  return (
    <StudentShell active="mess" band={band}>
      {(user) => (
        <div className="mx-auto max-w-xl">
          {error && <p role="alert" className="rounded-2xl bg-[#fbe9e7] px-4 py-3 text-sm text-danger">Couldn&apos;t load today&apos;s mess menu. Refresh to try again.</p>}
          {!error && !data && <p role="status" className="py-10 text-center text-muted">Loading…</p>}
          {data && (
            <>
              {data.meals.some((meal) => meal.items.length === 0) && <MessScreenshotImport meals={data.meals} user={user} onSaved={load} />}
              <ul>
                {data.meals.map((meal) => (
                  <MealRow
                    key={meal.meal}
                    meal={meal}
                    prediction={predicted.find((p) => p.meal === meal.meal)}
                    weekday={new Date(`${data.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" })}
                    onAdd={(m, initialText = "") => setForm({ meal: m, flag: false, initialText })}
                    onFlag={(m) => setForm({ meal: m, flag: true })}
                  />
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-mint px-4 py-3 text-[13px] text-mint-ink">
                Free for hostellers. Students add the menu each morning; if 3 say it&apos;s wrong, the most common correction replaces it.
              </p>
            </>
          )}
          {form && <MealForm meal={form.meal} flag={form.flag} initialText={form.initialText} onClose={() => setForm(null)} onSaved={load} />}
        </div>
      )}
    </StudentShell>
  );
}
