"use client";

import { useState } from "react";
import { api } from "../../lib/api";

// "I only eat veg", saved on the account. It decides what the menu, Deal me
// a dish and the passport's suggestions show first; it never blocks an
// order (the bag just warns if a non-veg dish is in it).
export default function DietSwitch({ initial }) {
  const [vegOnly, setVegOnly] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !vegOnly;
    setSaving(true);
    setError("");
    try {
      const saved = await api("/api/account/diet", { method: "PUT", body: { vegOnly: next } });
      setVegOnly(Boolean(saved.vegOnly));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Diet" className="mt-6 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">I only eat veg</p>
          <p className="text-sm text-muted">The menu, Deal me a dish and your passport suggestions start veg-only. You can still order non-veg, for a friend say: the bag will just remind you.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={vegOnly}
          aria-label="I only eat veg"
          disabled={saving}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${vegOnly ? "bg-deck" : "bg-[#CBD3CB]"}`}
        >
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${vegOnly ? "left-7" : "left-1"}`} />
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </section>
  );
}
