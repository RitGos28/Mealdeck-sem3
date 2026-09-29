"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../layout/Header";
import { api, formatInstant, formatTime } from "../../lib/api";
import { FINAL_STATUSES, StatusBadge } from "../../lib/orderStatus";

const REFRESH_MS = 15000;

// The next step(s) a vendor can take from each status; mirrors
// OrderStatus.canTransitionTo on the backend.
const ACTIONS = {
  PLACED: [{ to: "ACCEPTED", label: "Accept" }],
  ACCEPTED: [{ to: "READY", label: "Mark ready" }],
  READY: [{ to: "COMPLETED", label: "Picked up" }, { to: "NO_SHOW", label: "No-show", subtle: true }],
  // The auto no-show timer can fire just before a late student turns up.
  NO_SHOW: [{ to: "COMPLETED", label: "Picked up late" }],
};

function OrderCard({ order, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState(null);
  const final = FINAL_STATUSES.includes(order.status);

  async function moveTo(status) {
    setBusy(true);
    setError(null);
    try {
      onUpdated(await api(`/api/vendor/orders/${order.id}/status`, { method: "PATCH", body: { status } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setConfirmingCancel(false);
    }
  }

  return (
    <article className={`rounded-2xl border border-[#e5e7e0] bg-white p-4 ${final ? "opacity-60" : ""}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">#{order.id} · {order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerContact}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <ul className="mb-3 text-sm">
        {order.items.map((item) => <li key={item.menuItemId}>{item.quantity}× {item.menuItemName}</li>)}
      </ul>
      {order.noShowAt && <p className="mb-3 text-xs font-semibold text-[#9a4a3f]">Auto no-show at {formatInstant(order.noShowAt)} if not collected</p>}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm font-semibold">₹{order.total}</span>
        {!confirmingCancel && (ACTIONS[order.status] ?? []).map((action) => (
          <button
            key={action.to}
            disabled={busy}
            onClick={() => moveTo(action.to)}
            className={action.subtle
              ? "rounded-full border border-[#e5e7e0] px-3 py-1.5 text-xs font-semibold text-[#9a4a3f] hover:border-[#9a4a3f] disabled:opacity-50"
              : "rounded-full bg-[#0f2419] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a3827] disabled:opacity-50"}
          >
            {action.label}
          </button>
        ))}
        {!final && (confirmingCancel ? (
          <>
            <span className="text-xs text-gray-500">Cancel this order?</span>
            <button disabled={busy} onClick={() => moveTo("CANCELLED")} className="rounded-full bg-[#9a4a3f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Yes, cancel</button>
            <button disabled={busy} onClick={() => setConfirmingCancel(false)} className="rounded-full border border-[#e5e7e0] px-3 py-1.5 text-xs font-semibold">Keep</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => setConfirmingCancel(true)} className="px-2 py-1.5 text-xs font-semibold text-gray-400 hover:text-[#9a4a3f]">Cancel</button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-[#9a4a3f]" role="alert">{error}</p>}
    </article>
  );
}

export default function VendorOrders() {
  const router = useRouter();
  const [stall, setStall] = useState(null);
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showFinished, setShowFinished] = useState(false);

  const load = useCallback(() => Promise.all([api("/api/vendor/stall"), api("/api/vendor/orders")]).then(
    ([stallData, orderData]) => {
      setStall(stallData);
      setOrders(orderData);
      setLoadError(null);
    },
    (err) => {
      if (err.status === 401 || err.status === 403) {
        router.replace("/vendor/login");
        return;
      }
      setLoadError(err.message);
    },
  ), [router]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  function handleUpdated(updated) {
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
  }

  const active = orders?.filter((order) => !FINAL_STATUSES.includes(order.status)) ?? [];
  const finished = orders?.filter((order) => FINAL_STATUSES.includes(order.status)) ?? [];
  const visible = showFinished ? orders ?? [] : active;

  const bySlot = new Map();
  for (const order of visible) {
    const key = order.pickupTime ?? "none";
    if (!bySlot.has(key)) bySlot.set(key, []);
    bySlot.get(key).push(order);
  }

  const count = (status) => active.filter((order) => order.status === status).length;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-6 py-8 pb-16">
        <div className="mb-6">
          <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">Today&apos;s orders</h1>
          <p className="text-gray-500">{stall ? stall.name : "Loading…"} · refreshes every 15 seconds · ready orders not collected within 15 minutes become no-shows</p>
        </div>

        {loadError && <p className="mb-6 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]">{loadError}</p>}

        {orders && (
          <>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[["To accept", count("PLACED")], ["Preparing", count("ACCEPTED")], ["Ready", count("READY")]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#e5e7e0] bg-white p-4">
                  <p className="font-display text-2xl font-bold">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {visible.length === 0 && <p className="rounded-2xl bg-white px-4 py-8 text-center text-gray-500">{orders.length === 0 ? "No pre-orders yet today." : "All caught up. No open orders."}</p>}

            {[...bySlot.entries()].map(([time, slotOrders]) => (
              <section key={time} className="mb-6">
                <h2 className="font-display mb-2 text-lg font-bold">{time === "none" ? "No pickup time" : `Pickup ${formatTime(time)}`}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {slotOrders.map((order) => <OrderCard key={order.id} order={order} onUpdated={handleUpdated} />)}
                </div>
              </section>
            ))}

            {finished.length > 0 && (
              <button className="text-sm font-semibold text-[#3f6b3a] hover:underline" onClick={() => setShowFinished((value) => !value)}>
                {showFinished ? "Hide finished orders" : `Show ${finished.length} finished order${finished.length === 1 ? "" : "s"}`}
              </button>
            )}
          </>
        )}
      </main>
    </>
  );
}
