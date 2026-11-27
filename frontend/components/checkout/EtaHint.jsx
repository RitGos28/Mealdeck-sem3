"use client";

import { useEffect, useState } from "react";
import { api, formatTime } from "../../lib/api";

// A preparation-time estimate for one stall's part of the basket, from the
// ML model in ml/. The backend answers 204 (shown as nothing) unless
// estimates are switched on, so real students never see one. Render it with
// a key that changes with the basket and the picked slot, so a stale
// estimate is dropped as soon as either changes.
export default function EtaHint({ stallId, entries, pickupTime }) {
  const [eta, setEta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const items = entries.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity }));
    api(`/api/stalls/${stallId}/eta`, {
      method: "POST",
      body: { items, ...(pickupTime ? { pickupTime } : {}) },
    }).then(
      (result) => { if (!cancelled) setEta(result); },
      () => { if (!cancelled) setEta(null); },
    );
    return () => { cancelled = true; };
  }, [stallId, entries, pickupTime]);

  if (!eta) return null;
  const low = Math.floor(eta.low);
  const high = Math.ceil(eta.high);
  return (
    <p className="mt-2 rounded-xl bg-mint px-3 py-2 text-xs text-ink" role="status">
      <span className="font-semibold">About {Math.round(eta.minutes)} min to prepare</span>
      {high > low && ` (likely ${low}–${high} min)`}
      {pickupTime && `, with the queue ahead of the ${formatTime(pickupTime)} slot`}.
      {eta.simulated && <span className="block text-muted">Demo estimate from a model trained on simulated orders, not real kitchen times.</span>}
    </p>
  );
}
