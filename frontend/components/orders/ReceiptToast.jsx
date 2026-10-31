"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "../../lib/api";

const SECONDS = 8;

// Shown once, straight after checkout (My orders opened with ?placed=1): a
// paper receipt of what was just pre-ordered, one block per stall, and the
// reminder that payment happens at the counter. It closes itself after a
// few seconds, but not while it's being read (hovered, focused or touched).
// The order cards underneath keep the same details for later.
export default function ReceiptToast({ orders }) {
  const [open, setOpen] = useState(true);
  const [left, setLeft] = useState(SECONDS);
  const [held, setHeld] = useState(false);
  const closeRef = useRef(null);

  // Drop ?placed=1 so a reload or a shared link doesn't show it again.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("placed");
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    if (!open || held) return undefined;
    if (left <= 0) {
      setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
      return undefined;
    }
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, held, left]);

  if (!open || orders.length === 0) return null;
  const total = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      onTouchStart={() => setHeld(true)}
      className="receipt-toast fixed inset-x-4 top-4 z-40 mx-auto max-w-md drop-shadow-[0_18px_28px_rgba(11,31,20,.35)]"
    >
      <div className="rounded-t-2xl bg-[#FFFDF7] px-4 pt-3.5 pb-2.5 font-mono text-ink">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[15px] font-bold text-deck">✓ Pre-order placed</span>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Dismiss receipt" className="-mr-2 flex size-9 items-center justify-center rounded-full font-sans text-xl text-muted hover:bg-black/5 hover:text-ink">×</button>
        </div>
        {orders.map((order) => (
          <div key={order.id} className="mt-2">
            <p className="font-sans text-xs font-semibold tracking-[.05em] text-muted uppercase">{order.stallName} · #{order.id} · pick up {formatTime(order.pickupTime)}</p>
            {order.items.map((line) => (
              <div key={line.menuItemId} className="flex justify-between gap-3 py-0.5 text-[13px]">
                <span className="truncate">{line.quantity}× {line.menuItemName}</span>
                <span className="tabular-nums">₹{Number(line.priceAtOrder) * line.quantity}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-dashed border-[#C9D1C2] pt-2 font-bold">
          <span>TOTAL</span><span className="tabular-nums">₹{total}</span>
        </div>
        <p className="mt-1 font-sans text-xs text-muted">
          Pay at {orders.length > 1 ? "each counter" : "the counter"} when you pick up{held ? "" : ` · closes in ${left} s`}
        </p>
      </div>
      {/* Torn paper edge. */}
      <div aria-hidden="true" className="h-2.5 bg-[linear-gradient(-45deg,transparent_6px,#FFFDF7_6px),linear-gradient(45deg,transparent_6px,#FFFDF7_6px)] bg-[length:12px_12px] bg-repeat-x" />
    </div>
  );
}
