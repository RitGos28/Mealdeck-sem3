"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatTime, toSlotValue } from "../../lib/api";
import { LiveIndicator, useLiveTopic } from "../../lib/liveQueue";

// A cart spanning stalls becomes one order per stall on the backend, each
// with its own pickup slot -- so the slot picker is per stall too.
function groupByStall(cartItems) {
  const groups = new Map();
  for (const entry of cartItems) {
    if (!groups.has(entry.stallId)) groups.set(entry.stallId, { stallId: entry.stallId, stallName: entry.stallName, entries: [] });
    groups.get(entry.stallId).entries.push(entry);
  }
  return [...groups.values()];
}

// Keeps one stall's slot list live: every queue push carries fresh fill
// levels, so a slot someone else just filled greys out without a refresh.
function LiveSlots({ stallId, onSlots, onConnect }) {
  const connected = useLiveTopic(`/topic/stalls/${stallId}/queue`, {
    onMessage: (snapshot) => onSlots(stallId, snapshot.slots),
    onConnect,
  });
  return <LiveIndicator connected={connected} />;
}

// A picked time is only kept while it's still offered and has room.
function keepBookable(picked, slotsByStall) {
  return Object.fromEntries(Object.entries(picked).filter(([stallId, time]) =>
    slotsByStall[stallId]?.some((slot) => toSlotValue(slot.time) === time && !slot.full)));
}

export default function Checkout({ cartItems, total, onBack, onPlaced }) {
  const stalls = useMemo(() => groupByStall(cartItems), [cartItems]);
  const [slotsByStall, setSlotsByStall] = useState({});
  const [picked, setPicked] = useState({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const loadSlots = useCallback(() => Promise.all(stalls.map(({ stallId }) =>
    api(`/api/stalls/${stallId}/slots`).then((slots) => [stallId, slots], () => [stallId, null]),
  )).then((results) => {
    const next = Object.fromEntries(results);
    setSlotsByStall(next);
    // Drop a picked time that has since passed or filled, so it can't be submitted.
    setPicked((current) => keepBookable(current, next));
  }), [stalls]);

  function updateSlots(stallId, slots) {
    setSlotsByStall((current) => {
      const next = { ...current, [stallId]: slots };
      setPicked((picks) => keepBookable(picks, next));
      return next;
    });
  }

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const ready = stalls.every(({ stallId }) => picked[stallId]);

  async function placeOrder(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPlacing(true);
    setError(null);
    try {
      const orders = await api("/api/orders", {
        method: "POST",
        body: {
          customerName: form.get("customerName"),
          customerContact: form.get("customerContact"),
          items: cartItems.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity })),
          pickupTimes: picked,
        },
      });
      onPlaced(orders.map((order) => order.id));
    } catch (err) {
      setError(err.message);
      setPlacing(false);
      if (err.status === 409) loadSlots();
    }
  }

  return (
    <aside className="h-fit rounded-2xl border border-[#e5e7e0] bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Checkout</h2>
        <button className="text-sm font-semibold text-gray-500 hover:text-[#12180f]" onClick={onBack}>← Cart</button>
      </div>
      <form className="space-y-5" onSubmit={placeOrder}>
        {stalls.map(({ stallId, stallName, entries }) => {
          const slots = slotsByStall[stallId];
          return (
            <section key={stallId}>
              <h3 className="text-sm font-bold">{stallName}</h3>
              <p className="mb-2 text-xs text-gray-500">{entries.map((e) => `${e.quantity}× ${e.item.name}`).join(", ")}</p>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup time</p>
                <LiveSlots stallId={stallId} onSlots={updateSlots} onConnect={loadSlots} />
              </div>
              {slots === undefined && <p className="text-sm text-gray-500">Loading slots…</p>}
              {slots === null && <p className="text-sm text-[#9a4a3f]">Couldn&apos;t load pickup slots.</p>}
              {slots?.length === 0 && <p className="rounded-xl bg-[#f4f6f2] px-3 py-2.5 text-sm text-gray-500">No pickup slots left today at {stallName}.</p>}
              {slots?.length > 0 && (
                <div className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const value = toSlotValue(slot.time);
                    const selected = picked[stallId] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        disabled={slot.full}
                        onClick={() => setPicked((current) => ({ ...current, [stallId]: value }))}
                        className={`rounded-lg border px-1 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:border-[#f0f0ee] disabled:bg-[#f4f6f2] disabled:text-gray-400 ${selected ? "border-[#0f2419] bg-[#0f2419] text-white" : "border-[#e5e7e0] hover:border-[#3f6b3a]"}`}
                      >
                        {formatTime(slot.time)}
                        <span className={`block text-[10px] font-medium ${selected ? "text-white/70" : "text-gray-400"}`}>
                          {slot.full ? "Full" : `${slot.booked}/${slot.capacity}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        <div className="space-y-3 border-t border-[#e5e7e0] pt-4">
          <input name="customerName" required placeholder="Your name" autoComplete="name" className="w-full rounded-xl border border-[#e5e7e0] px-3 py-2.5 text-sm outline-none focus:border-[#3f6b3a]" />
          <input name="customerContact" required placeholder="Phone number" type="tel" autoComplete="tel" className="w-full rounded-xl border border-[#e5e7e0] px-3 py-2.5 text-sm outline-none focus:border-[#3f6b3a]" />
        </div>

        {error && <p className="rounded-xl bg-[#fbe9e7] px-3 py-2.5 text-sm text-[#9a4a3f]" role="alert">{error}</p>}

        <div>
          <div className="mb-1 flex justify-between font-bold"><span>Total</span><span>₹{total}</span></div>
          <p className="mb-3 text-xs text-gray-500">Pay at the counter when you pick up (cash or UPI). Collect within 15 minutes of it being ready, or it&apos;s marked a no-show.</p>
          <button className="w-full rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3827] disabled:cursor-not-allowed disabled:opacity-50" disabled={!ready || placing}>
            {placing ? "Placing order…" : ready ? "Place pre-order" : "Pick a pickup time"}
          </button>
        </div>
      </form>
    </aside>
  );
}
