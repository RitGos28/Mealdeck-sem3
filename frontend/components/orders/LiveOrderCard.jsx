"use client";

import { useState } from "react";
import { api, formatInstant, formatTime } from "../../lib/api";
import { LiveIndicator, useLiveTopic } from "../../lib/liveQueue";
import { FINAL_STATUSES, StatusBadge } from "../../lib/orderStatus";

// The server renders the order once; after that its stall's live queue
// keeps the status and place in line current. A finished order drops out
// of the queue, so its final status is fetched once it disappears.
export default function LiveOrderCard({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [ahead, setAhead] = useState(null);
  const final = FINAL_STATUSES.includes(order.status);

  function applySnapshot(snapshot) {
    const entry = snapshot.orders.find((queued) => queued.id === order.id);
    if (entry) {
      setOrder((current) => ({ ...current, status: entry.status, noShowAt: entry.noShowAt }));
      setAhead(entry.ahead);
    } else {
      setAhead(null);
      api(`/api/orders/${order.code}`).then(setOrder, () => {});
    }
  }

  const connected = useLiveTopic(final ? null : `/topic/stalls/${order.stallId}/queue`, {
    onMessage: applySnapshot,
    onConnect: () => api(`/api/stalls/${order.stallId}/queue`).then(applySnapshot, () => {}),
  });

  return (
    <article className="rounded-2xl border border-[#e5e7e0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{order.stallName}</p>
          <p className="font-display text-2xl font-bold">Order #{order.id}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
          {!final && <LiveIndicator connected={connected} />}
        </div>
      </div>
      {order.noShowAt && (
        <p className="mb-4 rounded-xl bg-[#dbead6] px-4 py-3 font-semibold text-[#3f6b3a]">
          Ready now! Collect by {formatInstant(order.noShowAt)} or it&apos;s marked a no-show.
        </p>
      )}
      {order.pickupTime && !order.noShowAt && !final && (
        <p className="mb-4 rounded-xl bg-[#f5faf3] px-4 py-3 text-[#3f6b3a]">
          Pick up at <span className="font-bold">{formatTime(order.pickupTime)}</span> today
          {ahead !== null && (
            <span className="block text-sm">
              {ahead === 0 ? "You're next in line at this stall." : `${ahead} order${ahead === 1 ? "" : "s"} ahead of you.`}
            </span>
          )}
        </p>
      )}
      <ul className="space-y-1.5 text-sm">
        {order.items.map((item) => (
          <li key={item.menuItemId} className="flex justify-between gap-3">
            <span>{item.quantity}× {item.menuItemName}</span>
            <span className="text-gray-500">₹{item.priceAtOrder * item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-[#e5e7e0] pt-3 font-bold"><span>Total</span><span>₹{order.total}</span></div>
    </article>
  );
}
