"use client";

import { demoInfo, useStore } from "../../lib/dishSignals";

// Shown only on a local demo run with simulated history (DEMO_HISTORY=true
// on the backend), so nobody mistakes the votes, Deal keeps and orders for
// real students' activity. Never shown on mealdeck.in.
export default function SimulatedDataBanner() {
  const info = useStore(demoInfo);
  if (!info.simulatedData) return null;
  return (
    <p role="note" className="rounded-xl border border-dashed border-deck px-3 py-2 text-[13px] text-mint-ink">
      <span className="font-semibold">Demo data:</span> votes, Deal keeps and orders here are simulated.
    </p>
  );
}
