"use client";

import { useState } from "react";
import { api } from "../../lib/api";

// "Learn from my Deal me a dish swipes", on by default. Turning it off
// deletes the keeps and skips it learned from, and the shared model is
// retrained without them (DealLearningService.setLearning).
export default function DealLearningSwitch({ initial }) {
  const [on, setOn] = useState(initial !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !on;
    setSaving(true);
    setError("");
    try {
      const saved = await api("/api/account/deal-learning", { method: "PUT", body: { on: next } });
      setOn(Boolean(saved.on));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Deal me a dish learning" className="mt-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">Learn from my Deal me a dish swipes</p>
          <p className="text-sm text-muted">
            {on
              ? "Your keeps and skips shape what you're dealt, and help everyone's deals. Turning this off deletes them."
              : "Off: your swipes aren't saved, and you get the same deals as a logged-out player."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Learn from my Deal me a dish swipes"
          disabled={saving}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-deck" : "bg-[#CBD3CB]"}`}
        >
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </section>
  );
}
