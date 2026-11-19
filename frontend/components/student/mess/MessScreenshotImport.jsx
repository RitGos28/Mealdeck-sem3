"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { DAY_NAMES, campusWeekday, mergeMeals, parseMessText } from "../../../lib/messScreenshot";
import BagSheet from "../../BagSheet";

// Reads MyCamu screenshots with OCR in the student's own browser (the image
// is never uploaded), then hands each meal's dishes to the student to check
// before anything is added. Engine and model load from /ocr (see
// scripts/copy-ocr-assets.mjs), only when someone uses this.
async function readScreenshots(files, onProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr",
    gzip: true,
  });
  try {
    const results = [];
    for (let i = 0; i < files.length; i += 1) {
      onProgress(i + 1);
      const { data } = await worker.recognize(files[i]);
      results.push(parseMessText(data.text));
    }
    return results;
  } finally {
    await worker.terminate();
  }
}

// One draft per meal found: its text (editable), and why it is or isn't
// ticked by default.
function toDrafts(found, meals) {
  const today = campusWeekday();
  return found.map((m) => {
    const existing = meals.find((meal) => meal.meal === m.meal);
    const added = Boolean(existing?.items?.length);
    const wrongDay = m.day !== null && m.day !== today;
    const notes = [];
    if (added) notes.push("Already added today. If it's wrong, use “This isn't correct” instead.");
    if (wrongDay) notes.push(`This screenshot shows ${DAY_NAMES[m.day]}'s menu, not today's.`);
    if (!m.complete) notes.push("It may be cut off at the bottom: check the last dish, or add a screenshot that shows the rest.");
    return {
      meal: m.meal,
      label: existing?.label ?? m.meal,
      text: m.dishes.join(", "),
      checked: !added && !wrongDay,
      locked: added,
      notes,
    };
  });
}

export default function MessScreenshotImport({ meals, user, onSaved }) {
  const router = useRouter();
  const input = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | reading | review | saving
  const [progress, setProgress] = useState({ at: 0, of: 0 });
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState("");
  const isStudent = user?.role === "STUDENT";

  async function onFiles(event) {
    const files = [...(event.target.files ?? [])].slice(0, 6);
    event.target.value = "";
    if (files.length === 0) return;
    setError("");
    setPhase("reading");
    setProgress({ at: 0, of: files.length });
    try {
      const results = await readScreenshots(files, (at) => setProgress({ at, of: files.length }));
      const found = mergeMeals(results);
      if (found.length === 0) {
        setError("Couldn't find a mess menu in that. Use a screenshot of MyCamu's mess menu page, with the dish list visible.");
        setPhase("idle");
        return;
      }
      setDrafts(toDrafts(found, meals));
      setPhase("review");
    } catch {
      setError("Couldn't read the screenshot on this device. You can still add the menu by hand below.");
      setPhase("idle");
    }
  }

  function update(i, change) {
    setDrafts((current) => current.map((d, j) => (j === i ? { ...d, ...change } : d)));
  }

  async function add() {
    setPhase("saving");
    setError("");
    const problems = [];
    for (const draft of drafts.filter((d) => d.checked && d.text.trim())) {
      try {
        await api(`/api/mess/today/${draft.meal}`, { method: "POST", body: { items: draft.text } });
      } catch (err) {
        if (err.status === 401 || err.status === 403) { router.push("/login?next=/mess"); return; }
        problems.push(`${draft.label}: ${err.message}`);
      }
    }
    await onSaved();
    if (problems.length) {
      setError(problems.join(" "));
      setPhase("review");
    } else {
      setPhase("idle");
      setDrafts([]);
    }
  }

  if (!isStudent) {
    return (
      <p className="mb-4 rounded-2xl border border-dashed border-field px-4 py-3 text-sm text-muted">
        Hosteller? <a href="/login?next=/mess" className="font-semibold text-deck hover:underline">Log in</a> to add today&apos;s menu from a MyCamu screenshot.
      </p>
    );
  }

  const ticked = drafts.filter((d) => d.checked && d.text.trim()).length;
  return (
    <section aria-label="Add from MyCamu screenshots" className="mb-4">
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={phase === "reading" || phase === "saving"}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-deck px-4 py-3 text-left hover:bg-mint disabled:opacity-60"
      >
        <span>
          <span className="block font-semibold text-deck">
            {phase === "reading" ? `Reading screenshot ${progress.at} of ${progress.of}…` : "Fill from MyCamu screenshots"}
          </span>
          <span className="block text-[13px] text-muted">Read on your phone: the screenshots are never uploaded. You check every dish before it&apos;s added.</span>
        </span>
        <span aria-hidden="true" className="text-xl text-deck">+</span>
      </button>
      {process.env.NEXT_PUBLIC_DEMO_GUEST === "1" && (
        <p className="mt-2 text-sm text-muted">No MyCamu? <a href="/demo-mess" className="font-semibold text-deck underline">Get sample screenshots</a></p>
      )}
      {error && <p role="alert" className="mt-2 rounded-xl bg-[#FBEDE6] px-3 py-2.5 text-sm text-danger">{error}</p>}

      {(phase === "review" || phase === "saving") && (
        <BagSheet onClose={() => { setPhase("idle"); setDrafts([]); }} label="Check the menu">
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl">Check before adding</h2>
              <p className="text-sm text-muted">Read from your screenshot. Fix anything that looks wrong, untick what you don&apos;t want to add.</p>
            </div>
            {drafts.map((draft, i) => (
              <div key={draft.meal} className="rounded-2xl border border-line p-3">
                <label className="flex items-center gap-2 font-serif text-lg">
                  <input type="checkbox" checked={draft.checked} disabled={draft.locked || phase === "saving"} onChange={(event) => update(i, { checked: event.target.checked })} className="size-5 accent-[#163D29]" />
                  {draft.label}
                </label>
                {draft.notes.map((note) => <p key={note} className="mt-1 text-xs text-danger">{note}</p>)}
                <label htmlFor={`ocr-${draft.meal}`} className="sr-only">{draft.label} dishes</label>
                <textarea
                  id={`ocr-${draft.meal}`}
                  value={draft.text}
                  onChange={(event) => update(i, { text: event.target.value })}
                  disabled={draft.locked || phase === "saving"}
                  rows={3}
                  maxLength={800}
                  className="mt-2 w-full rounded-xl border border-field bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-deck focus:ring-2 focus:ring-mint disabled:bg-[#F4F6F3] disabled:text-muted"
                />
              </div>
            ))}
            <button type="button" onClick={add} disabled={ticked === 0 || phase === "saving"} className="h-12 w-full rounded-full bg-deck font-semibold text-white hover:bg-deck-hover disabled:opacity-50">
              {phase === "saving" ? "Adding…" : ticked === 0 ? "Nothing ticked to add" : `Add ${ticked} meal${ticked === 1 ? "" : "s"}`}
            </button>
          </div>
        </BagSheet>
      )}
    </section>
  );
}
