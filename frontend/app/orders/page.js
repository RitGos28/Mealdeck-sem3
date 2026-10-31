import Link from "next/link";
import { cookies } from "next/headers";
import LiveOrderCard from "../../components/orders/LiveOrderCard";
import ReceiptToast from "../../components/orders/ReceiptToast";
import FeedbackLink from "../../components/FeedbackLink";
import StudentShell from "../../components/student/StudentShell";
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

function itemsSummary(items = []) {
  return items.map((item) => `${item.quantity}× ${item.menuItemName}`).join(", ");
}

// A finished order, or one from an earlier day: one row, linking to its card.
function PastOrderRow({ order }) {
  return (
    <Link href={`/orders?codes=${order.code}`} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 hover:border-field hover:bg-mint/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-semibold text-ink">{order.stallName}</p>
          <p className="shrink-0 font-semibold text-ink">₹{order.total}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted">{itemsSummary(order.items)}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{formatDay(order.pickupDate)} · Order #{order.id}</p>
          <StatusBadge status={order.status} />
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted group-hover:text-ink"><path d="M9 6l6 6-6 6" /></svg>
    </Link>
  );
}

export default async function OrdersPage({ searchParams }) {
  const { codes, placed } = await searchParams;
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
  const title = mine ? "My orders" : orders.length > 1 ? "Your orders" : "Your order";

  const band = (
    <div className="mt-5 md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none">
      <h1 className="font-serif text-3xl leading-tight">{title}</h1>
      <p className="mt-1 text-sm text-on-deck">Live updates — we&apos;ll show when it&apos;s ready</p>
    </div>
  );

  return (
    <StudentShell active="orders" band={band}>
      {placed === "1" && !mine && <ReceiptToast orders={orders} />}
      <div className="mx-auto max-w-3xl lg:max-w-5xl">
        {failed && <p role="alert" className="rounded-2xl bg-[#fbe9e7] px-4 py-3 text-sm text-danger">Couldn&apos;t reach the server. Refresh to try again.</p>}

        {!failed && loggedOut && (
          <div className="py-10 text-center">
            <p className="font-serif text-2xl text-ink">Log in to see your {mine ? "orders" : "order"}</p>
            <p className="mt-1 text-sm text-muted">Your pre-orders and their live status show up here.</p>
            <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="mt-5 inline-flex h-12 items-center rounded-full bg-deck px-6 font-semibold text-white hover:bg-deck-hover">Log in</Link>
          </div>
        )}

        {!failed && !loggedOut && orders.length === 0 && (
          <div className="py-10 text-center">
            <p className="font-serif text-2xl text-ink">{mine ? "No orders yet" : "No orders found"}</p>
            <p className="mt-1 text-sm text-muted">{mine ? "Pre-order from any stall and skip the queue." : "This link may be old, or for another account."}</p>
            <Link href="/" className="mt-5 inline-flex h-12 items-center rounded-full bg-deck px-6 font-semibold text-white hover:bg-deck-hover">Browse the menu</Link>
          </div>
        )}

        {live.length > 0 && (
          <section aria-labelledby="today-heading">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="today-heading" className="font-serif text-2xl text-ink">Today</h2>
              <p className="text-sm text-muted">Show the order number at the counter. Pay by UPI when you pick up (or card, where the stall takes it). Stalls don&apos;t take cash.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {live.map((order) => <LiveOrderCard key={order.id} initialOrder={order} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section aria-labelledby="earlier-heading" className={live.length > 0 ? "mt-10" : ""}>
            <h2 id="earlier-heading" className="mb-3 font-serif text-2xl text-ink">Earlier</h2>
            <div className="grid gap-2 md:grid-cols-2 md:gap-3">
              {past.map((order) => <PastOrderRow key={order.id} order={order} />)}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-full border border-field px-5 text-sm font-semibold text-ink hover:border-deck">← Back to menu</Link>
          {!mine && !loggedOut && <Link href="/orders" className="inline-flex h-11 items-center rounded-full border border-field px-5 text-sm font-semibold text-ink hover:border-deck">All my orders →</Link>}
        </div>
        <p className="mt-6 text-sm text-muted">Something not right? <FeedbackLink className="font-semibold text-deck underline underline-offset-2" /></p>
      </div>
    </StudentShell>
  );
}
