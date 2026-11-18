"use client";

import { demoInfo, useStore } from "../../lib/dishSignals";

// Shown only on a local demo run with simulated history (DEMO_HISTORY=true
// on the backend), so nobody mistakes the votes, Deal keeps and orders for
// real students' activity. Never shown on mealdeck.in.
export default function SimulatedDataBanner() {
  const info = useStore(demoInfo);
  if (!info.simulatedData) return null;
  return (
    <p role="note" className="rounded-2xl border border-dashed border-deck bg-mint px-4 py-3 text-sm text-mint-ink">
      <span className="font-semibold">Demo data.</span> The votes, Deal me a dish keeps and orders on this copy are simulated, and real stalls are shown menu only, as on mealdeck.in.
    </p>
  );
}
