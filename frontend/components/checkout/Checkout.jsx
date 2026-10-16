"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

// Why a pick was dropped, so it doesn't just silently disappear.
function droppedReason(time, slots) {
  const slot = slots?.find((s) => toSlotValue(s.time) === time);
  return slot?.full
    ? `${formatTime(time)} just filled up. Pick another time.`
    : `${formatTime(time)} has passed. Pick another time.`;
}

// Drop a picked time that has since passed or filled, so it can't be
// submitted, and say why next to that stall's slots.
function dropUnbookable(slotsByStall, setPicked, setNotices) {
  setPicked((current) => {
    const kept = keepBookable(current, slotsByStall);
    const dropped = Object.keys(current).filter((stallId) => !(stallId in kept));
    if (dropped.length > 0) {
      setNotices((existing) => ({
        ...existing,
        ...Object.fromEntries(dropped.map((stallId) => [stallId, droppedReason(current[stallId], slotsByStall[stallId])])),
      }));
    }
    return kept;
  });
}

export default function Checkout({ cartItems, total, user, onBack, onPlaced }) {
  const router = useRouter();
  const stalls = useMemo(() => groupByStall(cartItems), [cartItems]);
  const [slotsByStall, setSlotsByStall] = useState({});
  const [picked, setPicked] = useState({});
  const [notices, setNotices] = useState({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const loadSlots = useCallback(() => Promise.all(stalls.map(({ stallId }) =>
    api(`/api/stalls/${stallId}/slots`).then((slots) => [stallId, slots], () => [stallId, null]),
  )).then((results) => {
    const next = Object.fromEntries(results);
    setSlotsByStall(next);
    dropUnbookable(next, setPicked, setNotices);
  }), [stalls]);

  function updateSlots(stallId, slots) {
    setSlotsByStall((current) => {
      const next = { ...current, [stallId]: slots };
      dropUnbookable(next, setPicked, setNotices);
      return next;
    });
  }

  function pick(stallId, value) {
    setPicked((current) => ({ ...current, [stallId]: value }));
    setNotices(({ [stallId]: _cleared, ...rest }) => rest);
  }

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const ready = stalls.every(({ stallId }) => picked[stallId]);

  async function placeOrder(event) {
    event.preventDefault();
    setPlacing(true);
    setError(null);
    try {
      const orders = await api("/api/orders", {
        method: "POST",
        body: {
          items: cartItems.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity })),
          pickupTimes: picked,
        },
      });
      onPlaced(orders.map((order) => order.id));
    } catch (err) {
      // Session expired mid-checkout: log in again, the bag is kept.
      if (err.status === 401 || err.status === 403) {
        router.push("/login?next=/");
        return;
      }
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
              {notices[stallId] && <p className="mb-2 rounded-lg bg-[#fbe9e7] px-3 py-2 text-xs font-semibold text-[#9a4a3f]" role="status">{notices[stallId]}</p>}
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
                        onClick={() => pick(stallId, value)}
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

        <p className="border-t border-[#e5e7e0] pt-4 text-sm text-gray-500">
          Ordering as <span className="font-semibold text-[#12180f]">{user.email}</span>. The stall sees your name and your phone number, or your email if you didn&apos;t add one.
        </p>

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
