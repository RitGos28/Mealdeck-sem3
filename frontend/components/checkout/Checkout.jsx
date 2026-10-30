"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatTime, toSlotValue } from "../../lib/api";
import { LiveIndicator, useLiveTopic } from "../../lib/liveQueue";
import { readPreferredPickup } from "../student/PickupChips";

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
function LiveSlots({ stallId, onSnapshot, onConnect }) {
  const connected = useLiveTopic(`/topic/stalls/${stallId}/queue`, {
    onMessage: (snapshot) => onSnapshot(stallId, snapshot),
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

// The slot to pre-select from the menu's pickup preference: "ASAP" is the
// first slot with room; a time is that slot if it has room, else the first
// one after it that does.
function preferredSlot(slots, preferred) {
  const open = slots.filter((slot) => !slot.full);
  const choice = preferred === "ASAP"
    ? open[0]
    : open.find((slot) => toSlotValue(slot.time) === preferred) ?? open.find((slot) => toSlotValue(slot.time) >= preferred);
  return choice ? toSlotValue(choice.time) : null;
}

export default function Checkout({ cartItems, total, user, onBack, onPlaced }) {
  const router = useRouter();
  const stalls = useMemo(() => groupByStall(cartItems), [cartItems]);
  const [slotsByStall, setSlotsByStall] = useState({});
  const [picked, setPicked] = useState({});
  const [notices, setNotices] = useState({});
  const [pausedStalls, setPausedStalls] = useState({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  // Stalls already pre-selected once. Later reloads (reconnects, a 409)
  // leave an empty pick empty, so a dropped time is never swapped silently.
  const prefilled = useRef(new Set());

  // The queue snapshot, not just /slots: it also says whether the stall has
  // paused orders, so a row of "Full" slots can be explained.
  const loadSlots = useCallback(() => Promise.all(stalls.map(({ stallId }) =>
    api(`/api/stalls/${stallId}/queue`).then((snapshot) => [stallId, snapshot], () => [stallId, null]),
  )).then((results) => {
    const next = Object.fromEntries(results.map(([stallId, snapshot]) => [stallId, snapshot?.slots ?? null]));
    setPausedStalls(Object.fromEntries(results.map(([stallId, snapshot]) => [stallId, Boolean(snapshot?.ordersPaused)])));
    setSlotsByStall(next);
    dropUnbookable(next, setPicked, setNotices);
    const preferred = readPreferredPickup();
    const prefills = {};
    for (const [stallId, snapshot] of results) {
      if (prefilled.current.has(String(stallId)) || !snapshot?.slots || snapshot.ordersPaused) continue;
      prefilled.current.add(String(stallId));
      const value = preferredSlot(snapshot.slots, preferred);
      if (value) prefills[stallId] = value;
    }
    if (Object.keys(prefills).length > 0) {
      setPicked((current) => {
        const fill = Object.fromEntries(Object.entries(prefills).filter(([stallId]) => !current[stallId]));
        return Object.keys(fill).length > 0 ? { ...current, ...fill } : current;
      });
    }
  }), [stalls]);

  function updateFromSnapshot(stallId, snapshot) {
    setPausedStalls((current) => ({ ...current, [stallId]: snapshot.ordersPaused }));
    setSlotsByStall((current) => {
      const next = { ...current, [stallId]: snapshot.slots };
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
      onPlaced(orders.map((order) => order.code));
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
    <aside aria-labelledby="checkout-heading" className="h-fit bg-white text-ink lg:rounded-3xl lg:border lg:border-line lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="checkout-heading" className="font-serif text-[22px]">Checkout</h2>
        <button type="button" className="-mr-2 flex h-11 items-center rounded-full px-3 text-sm font-semibold text-muted hover:bg-[#F4F6F3] hover:text-ink" onClick={onBack}><span aria-hidden="true">←&nbsp;</span>Bag</button>
      </div>
      <form className="space-y-6" onSubmit={placeOrder}>
        {stalls.map(({ stallId, stallName, entries }) => {
          const slots = slotsByStall[stallId];
          return (
            <section key={stallId}>
              <h3 className="font-serif text-lg">{stallName}</h3>
              <p className="mb-3 text-sm text-muted">{entries.map((e) => `${e.quantity}× ${e.item.name}`).join(", ")}</p>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[.04em] text-muted uppercase">Pickup time</p>
                <LiveSlots stallId={stallId} onSnapshot={updateFromSnapshot} onConnect={loadSlots} />
              </div>
              {pausedStalls[stallId] && <p className="mb-2 rounded-xl bg-[#FBEDE6] px-3 py-2 text-xs font-semibold text-danger" role="status">{stallName} has paused new orders for now. This updates live when they resume.</p>}
              {notices[stallId] && !pausedStalls[stallId] && <p className="mb-2 rounded-xl bg-[#FBEDE6] px-3 py-2 text-xs font-semibold text-danger" role="status">{notices[stallId]}</p>}
              {slots === undefined && <p className="text-sm text-muted">Loading slots…</p>}
              {slots === null && <p className="text-sm text-danger">Couldn&apos;t load pickup slots.</p>}
              {slots?.length === 0 && <p className="rounded-xl bg-[#F4F6F3] px-3 py-2.5 text-sm text-muted">No pickup slots left today at {stallName}.</p>}
              {slots?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:max-h-56 lg:grid-cols-3 lg:overflow-y-auto lg:p-0.5">
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
                        className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-[#F4F6F3] disabled:text-[#9AA59E] ${selected ? "border-deck bg-deck text-white" : "border-field text-ink hover:border-deck hover:bg-mint"}`}
                      >
                        {formatTime(slot.time)}
                        <span className={`block text-[11px] font-medium ${selected ? "text-white/75" : "text-muted"}`}>
                          {pausedStalls[stallId] ? "Paused" : slot.full ? "Full" : `${slot.capacity - slot.booked} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        <p className="border-t border-line pt-4 text-sm text-muted">
          Ordering as <span className="font-semibold text-ink">{user.email}</span>. The stall sees your name and your phone number, or your email if you didn&apos;t add one.
        </p>

        {error && <p className="rounded-xl bg-[#FBEDE6] px-3 py-2.5 text-sm text-danger" role="alert">{error}</p>}

        <div>
          <div className="mb-1 flex justify-between text-base font-semibold"><span>Total</span><span>₹{total}</span></div>
          <p className="mb-3 text-xs text-muted">Pay at the counter when you pick up (cash or UPI). Collect within 15 minutes of it being ready, or it&apos;s marked a no-show.</p>
          <button className="flex h-12 w-full items-center justify-center rounded-full bg-deck text-[15px] font-semibold text-white transition-colors hover:bg-deck-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-deck" disabled={!ready || placing}>
            {placing ? "Placing order…" : ready ? "Place pre-order" : "Pick a pickup time"}
          </button>
        </div>
      </form>
    </aside>
  );
}
