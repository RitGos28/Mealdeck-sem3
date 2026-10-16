import Link from "next/link";
import Header from "../../components/layout/Header";
import LiveOrderCard from "../../components/orders/LiveOrderCard";

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
          {orders.map((order) => <LiveOrderCard key={order.id} initialOrder={order} />)}
        </div>

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[#3f6b3a] hover:underline">← Back to menu</Link>
      </main>
    </>
  );
}
