import Link from "next/link";
import Header from "../../components/layout/Header";
import { formatInstant, formatTime } from "../../lib/api";
import { StatusBadge } from "../../lib/orderStatus";

export const metadata = { title: "Your pre-order · MealDeck" };

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

// Checkout lands here as /orders?ids=12,13 (one order per stall in the cart).
async function getOrders(ids) {
  const idList = String(ids ?? "").split(",").filter((id) => /^\d+$/.test(id)).slice(0, 10);
  const orders = await Promise.all(idList.map(async (id) => {
    const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  }));
  return orders.filter(Boolean);
}

export default async function OrdersPage({ searchParams }) {
  const { ids } = await searchParams;
  let orders = [];
  let failed = false;
  try {
    orders = await getOrders(ids);
  } catch {
    failed = true;
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-6 py-8 pb-16">
        <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">{orders.length > 1 ? "Your pre-orders" : "Your pre-order"}</h1>
        <p className="mb-6 text-gray-500">Show the order number at the counter. Pay when you pick up (cash or UPI).</p>

        {failed && <p className="rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]">Couldn&apos;t reach the server. Refresh to try again.</p>}
        {!failed && orders.length === 0 && <p className="py-6 text-gray-500">No orders found.</p>}

        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-[#e5e7e0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{order.stallName}</p>
                  <p className="font-display text-2xl font-bold">Order #{order.id}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              {order.noShowAt && (
                <p className="mb-4 rounded-xl bg-[#dbead6] px-4 py-3 font-semibold text-[#3f6b3a]">
                  Ready now! Collect by {formatInstant(order.noShowAt)} or it&apos;s marked a no-show.
                </p>
              )}
              {order.pickupTime && !order.noShowAt && (
                <p className="mb-4 rounded-xl bg-[#f5faf3] px-4 py-3 text-[#3f6b3a]">
                  Pick up at <span className="font-bold">{formatTime(order.pickupTime)}</span> today
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
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[#3f6b3a] hover:underline">← Back to menu</Link>
      </main>
    </>
  );
}
