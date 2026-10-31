"use client";

import { useState } from "react";
import { api, formatInstant, formatTime } from "../../lib/api";
import { LiveIndicator, useLiveTopic } from "../../lib/liveQueue";
import { FINAL_STATUSES, STATUS_LABELS, STATUS_STYLES } from "../../lib/orderStatus";
import { NewStampWatcher } from "../student/passport/PassportViews";

// The server renders the order once; after that its stall's live queue
// keeps the status and place in line current. A finished order drops out
// of the queue, so its final status is fetched once it disappears.
export default function LiveOrderCard({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [ahead, setAhead] = useState(null);
  // Only an order seen live gets the "New stamp!" moment, not one that was
  // already picked up when the page opened.
  const [wasLive] = useState(() => !FINAL_STATUSES.includes(initialOrder.status));
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
    <article className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted">{order.stallName}</p>
          <h3 className="font-serif text-3xl leading-tight text-ink">Order #{order.id}</h3>
        </div>
        {!final && <LiveIndicator connected={connected} />}
      </div>

      <p className="mt-3">
        <span className={`inline-flex min-h-9 items-center rounded-full px-4 text-base font-semibold ${STATUS_STYLES[order.status] ?? ""}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
      </p>

      {order.noShowAt && (
        <p role="status" className="mt-4 rounded-2xl bg-mint px-4 py-4 text-mint-ink">
          <span className="block font-serif text-2xl leading-tight">Ready now!</span>
          <span className="mt-1 block font-semibold">Collect by {formatInstant(order.noShowAt)} or it&apos;s marked a no-show.</span>
        </p>
      )}
      {order.pickupTime && !order.noShowAt && !final && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 rounded-2xl border border-line px-4 py-3">
          <p className="text-sm text-muted">Pick up today at <span className="block text-2xl font-semibold text-ink">{formatTime(order.pickupTime)}</span></p>
          {ahead !== null && (
            <p className="text-sm font-semibold text-mint-ink">
              {ahead === 0 ? "You're next in line" : `${ahead} ahead of you`}
            </p>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-1.5 text-sm">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="text-ink">{item.quantity}× {item.menuItemName}{item.choices && <span className="block text-[12px] text-muted">{item.choices}</span>}</span>
            <span className="text-muted">₹{item.priceAtOrder * item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold text-ink"><span>Total</span><span>₹{order.total}</span></div>
      <NewStampWatcher order={order} wasLive={wasLive} />
    </article>
  );
}
