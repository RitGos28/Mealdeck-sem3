import Link from "next/link";
import { cookies } from "next/headers";
import Header from "../../components/layout/Header";
import LiveOrderCard from "../../components/orders/LiveOrderCard";
import { FINAL_STATUSES, StatusBadge } from "../../lib/orderStatus";

export const metadata = { title: "Your orders · MealDeck" };

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

// Checkout lands here as /orders?codes=K7QM2XR9TP4D,... (one order per stall
// in the cart). Orders are named by their 12-character public code; the
// number on the card is the order number for the counter.
// The backend only shows an order to whoever placed it (or its stall or an
// admin), so this server-side fetch passes the visitor's session cookie on.
async function getOrders(codes) {
  const codeList = String(codes ?? "").split(",").filter((code) => /^[2-9A-HJKMNP-Z]{12}$/.test(code)).slice(0, 10);
  const cookie = (await cookies()).toString();
  let loggedOut = false;
  const orders = await Promise.all(codeList.map(async (code) => {
    const res = await fetch(`${BACKEND_URL}/api/orders/${code}`, { cache: "no-store", headers: { cookie } });
    if (res.status === 401 || res.status === 403) loggedOut = true;
    return res.ok ? res.json() : null;
  }));
  return { orders: orders.filter(Boolean), loggedOut };
}

// With no codes, the page is "My orders": every order the logged-in student
// has placed, from GET /api/orders.
async function getMyOrders() {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${BACKEND_URL}/api/orders`, { cache: "no-store", headers: { cookie } });
  if (res.status === 401 || res.status === 403) return { orders: [], loggedOut: true };
  if (!res.ok) throw new Error(`GET /api/orders: ${res.status}`);
  return { orders: await res.json(), loggedOut: false };
}

function campusToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatDay(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// A finished order, or one from an earlier day: one line, linking to its card.
function PastOrderRow({ order }) {
  return (
    <Link href={`/orders?codes=${order.code}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e7e0] bg-white px-4 py-3 hover:border-[#3f6b3a]">
      <div className="min-w-0">
        <p className="truncate font-semibold">#{order.id} · {order.stallName}</p>
        <p className="text-sm text-gray-500">{formatDay(order.pickupDate)} · ₹{order.total}</p>
      </div>
      <StatusBadge status={order.status} />
    </Link>
  );
}

export default async function OrdersPage({ searchParams }) {
  const { codes } = await searchParams;
  const mine = !codes;
  let orders = [];
  let loggedOut = false;
  let failed = false;
  try {
    ({ orders, loggedOut } = mine ? await getMyOrders() : await getOrders(codes));
  } catch {
    failed = true;
  }
  // On "My orders", only today's unfinished orders get a live card.
  const today = campusToday();
  const live = mine ? orders.filter((order) => order.pickupDate === today && !FINAL_STATUSES.includes(order.status)) : orders;
  const past = mine ? orders.filter((order) => !live.includes(order)) : [];
  const returnTo = mine ? "/orders" : `/orders?codes=${codes}`;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 sm:px-6">
        <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">{mine ? "My orders" : orders.length > 1 ? "Your pre-orders" : "Your pre-order"}</h1>
        <p className="mb-6 text-gray-500">Show the order number at the counter. Pay when you pick up (cash or UPI).</p>

        {failed && <p className="rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]">Couldn&apos;t reach the server. Refresh to try again.</p>}
        {!failed && loggedOut && (
          <p className="py-6 text-gray-500">
            <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="font-semibold text-[#3f6b3a] hover:underline">Log in</Link> to see your {mine ? "orders" : "order"}.
          </p>
        )}
        {!failed && !loggedOut && orders.length === 0 && <p className="py-6 text-gray-500">{mine ? "You haven't placed any orders yet." : "No orders found."}</p>}

        <div className="space-y-4">
          {live.map((order) => <LiveOrderCard key={order.id} initialOrder={order} />)}
        </div>

        {past.length > 0 && (
          <section className={live.length > 0 ? "mt-10" : ""}>
            <h2 className="font-display mb-3 text-lg font-bold">Earlier</h2>
            <div className="space-y-2">
              {past.map((order) => <PastOrderRow key={order.id} order={order} />)}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/" className="text-[#3f6b3a] hover:underline">← Back to menu</Link>
          {!mine && !loggedOut && <Link href="/orders" className="text-[#3f6b3a] hover:underline">All my orders →</Link>}
        </div>
      </main>
    </>
  );
}
