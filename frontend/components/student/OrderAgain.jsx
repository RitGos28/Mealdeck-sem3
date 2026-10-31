"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const MAX_CARDS = 4;

// Letters only, so "Macaroni (Veg)" is "MV" and "Bistro / Kathi" is "BK".
export function initials(name) {
  return name.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

// Dishes from the student's past orders that can be ordered right now,
// newest first. Orders arrive newest first from GET /api/orders.
function reorderable(orders, stalls) {
  const byId = new Map();
  for (const stall of stalls) {
    if (stall.ordersPaused || stall.closedToday) continue;
    for (const item of stall.items) {
      if (item.available) byId.set(String(item.id), { item, stall });
    }
  }
  const seen = new Set();
  const picks = [];
  for (const order of orders) {
    for (const line of order.items ?? []) {
      const key = String(line.menuItemId);
      if (seen.has(key)) continue;
      seen.add(key);
      if (byId.has(key)) picks.push(byId.get(key));
      if (picks.length === MAX_CARDS) return picks;
    }
  }
  return picks;
}

function Thumb({ item }) {
  const [failed, setFailed] = useState(false);
  if (item.image && !failed) {
    return <Image src={item.image} alt="" width={40} height={40} sizes="40px" onError={() => setFailed(true)} className="size-10 shrink-0 rounded-full object-cover" />;
  }
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint font-serif text-[15px] text-mint-ink" aria-hidden="true">{initials(item.name)}</span>;
}

export default function OrderAgain({ stalls, user, onAdd }) {
  const [orders, setOrders] = useState([]);
  const isStudent = user?.role === "STUDENT";

  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    api("/api/orders").then(
      (result) => { if (!cancelled) setOrders(Array.isArray(result) ? result : []); },
      () => {}, // Logged out meanwhile, or the backend hiccuped: just skip the row.
    );
    return () => { cancelled = true; };
  }, [isStudent]);

  const picks = useMemo(() => (isStudent ? reorderable(orders, stalls) : []), [isStudent, orders, stalls]);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="order-again">
      <h2 id="order-again" className="mb-2.5 font-serif text-xl">Order again</h2>
      <ul className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-2 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {picks.map(({ item, stall }) => (
          <li key={item.id} className="flex w-60 shrink-0 items-center sm:w-auto sm:min-w-0 gap-2.5 rounded-2xl border border-line py-2 pr-1.5 pl-2">
            <Thumb item={item} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold sm:line-clamp-2 sm:whitespace-normal" title={item.name}>{item.name}</p>
              <p className="text-xs text-muted">₹{item.price}</p>
            </div>
            <button type="button" onClick={() => onAdd(item, stall)} aria-label={`Add ${item.name} again`} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-deck text-xl text-white hover:bg-deck-hover">+</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
