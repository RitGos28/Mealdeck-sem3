"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import MenuSection from "../components/menu/MenuSection";
import Cart from "../components/cart/Cart";
import Checkout from "../components/checkout/Checkout";
import { useCurrentUser } from "../lib/useCurrentUser";

// The bag survives the trip to /login and back (ordering needs a login),
// but only for this tab. Storage can be unavailable (private mode, blocked
// site data), so every access is guarded and the page works without it.
const CART_KEY = "mealdeck.cart";

function loadCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCart(cart) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Not saved; the bag just won't survive a reload.
  }
}

const DISH_IMAGES = {
  "paneer kathi roll": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
  "chicken kathi roll": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
  "veg sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "cold coffee": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  "chicken burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "fresh lime soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "oreo shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
};

const DISH_IMAGE_KEYWORDS = [
  ["dosa", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80"],
  ["idli", "https://images.unsplash.com/photo-1630409351217-bc4fa6422075?auto=format&fit=crop&w=800&q=80"],
  ["roll", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"],
  ["wrap", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["sandwich", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["burger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"],
  ["fries", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80"],
  ["coffee", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"],
  ["soda", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80"],
  ["shake", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"],
];

function imageForDish(item) {
  if (item.image) return item.image;
  const name = item.name.trim().toLowerCase();
  if (DISH_IMAGES[name]) return DISH_IMAGES[name];
  return DISH_IMAGE_KEYWORDS.find(([keyword]) => name.includes(keyword))?.[1]
    ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80";
}

// True while the element is on screen, so the phone's "View bag" bar can
// step aside once the bag itself is visible.
function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return onScreen;
}

export default function MenuExperience({ stalls, demoMode }) {
  const router = useRouter();
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [user] = useCurrentUser();
  const bagRef = useRef(null);
  const bagOnScreen = useOnScreen(bagRef);

  // Read after mount, not in useState: the server render has no storage.
  useEffect(() => {
    setCart(loadCart()); // eslint-disable-line react-hooks/set-state-in-effect
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (cartLoaded) saveCart(cart);
  }, [cart, cartLoaded]);
  const [search, setSearch] = useState("");
  const menuStalls = stalls.map((stall) => ({
    ...stall,
    items: stall.items.map((item) => ({
      ...item,
      image: imageForDish(item),
    })),
  }));

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemCount = cartItems.reduce((count, entry) => count + entry.quantity, 0);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  const visibleStalls = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menuStalls;
    return menuStalls
      .map((stall) => ({ ...stall, items: stall.items.filter((item) => item.name.toLowerCase().includes(query)) }))
      .filter((stall) => stall.items.length > 0);
  }, [menuStalls, search]);

  function addToCart(item, stall) {
    setCart((current) => ({
      ...current,
      [item.id]: {
        item,
        stallId: stall.id,
        stallName: stall.name,
        quantity: (current[item.id]?.quantity ?? 0) + 1,
      },
    }));
  }

  function handlePlaced(orderCodes) {
    setCart({});
    setCheckingOut(false);
    router.push(`/orders?codes=${orderCodes.join(",")}`);
  }

  function changeQuantity(itemId, change) {
    setCart((current) => {
      const entry = current[itemId];
      if (!entry) return current;
      const quantity = entry.quantity + change;
      if (quantity <= 0) {
        const { [itemId]: removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [itemId]: { ...entry, quantity } };
    });
  }

  return (
    <>
      <Header itemCount={itemCount} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10 lg:pb-16">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#173725] px-5 py-7 text-white shadow-[0_20px_55px_-28px_rgba(17,55,35,.7)] sm:px-9 sm:py-10">
          <div className="absolute -right-12 -top-20 size-64 rounded-full bg-[#a8dc78]/20 blur-2xl" />
          <div className="relative max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#c9e8a9]">Campus food, without the wait</p>
            <h1 className="font-display mb-3 text-4xl font-bold tracking-tight sm:text-5xl">Today&apos;s menu,<br />ready when you are.</h1>
            <p className="max-w-md text-sm leading-6 text-white/75 sm:text-base">See what&apos;s available, order ahead, and pick up at the time that suits you.</p>
          </div>
          <div className="relative mt-5 flex flex-wrap sm:mt-7 gap-2 text-xs font-semibold text-[#d9edcb]"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">● Live availability</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">◷ Quick pickup</span></div>
        </section>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold tracking-tight">Explore the stalls</h2><p className="mt-1 text-sm text-gray-500">Fresh picks from around campus.</p></div><p className="rounded-full border border-[#dce5d8] bg-white px-3 py-1.5 text-xs font-semibold text-[#477355]">{menuStalls.length} stalls open</p></div>

        <label className="mb-7 flex max-w-md items-center gap-3 rounded-2xl border border-[#dce6d8] bg-white px-4 py-3 shadow-[0_10px_24px_-22px_rgba(21,55,33,.65)]"><span className="text-lg" aria-hidden="true">⌕</span><span className="sr-only">Search the menu</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes, snacks, or drinks" />{search && <button type="button" className="rounded-full px-2 py-1 text-xs font-semibold text-[#477355] hover:bg-[#f2f6ef]" onClick={() => setSearch("")} aria-label="Clear search">Clear</button>}</label>
        {demoMode && <p className="mb-6 rounded-xl border border-[#dbead6] bg-[#f5faf3] px-4 py-3 text-sm text-[#3f6b3a]">Showing sample menu data. Start the backend later to load live availability.</p>}
        {!demoMode && menuStalls.length === 0 && <p className="py-10 text-gray-500">No stalls yet.</p>}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {visibleStalls.map((stall) => <MenuSection key={stall.id} stall={stall} demoMode={demoMode} onAddToCart={addToCart} />)}
            {visibleStalls.length === 0 && <div className="rounded-2xl border border-dashed border-[#cbdac6] bg-white px-6 py-12 text-center"><p className="font-display text-lg font-bold">No dishes found</p><p className="mt-1 text-sm text-gray-500">Try another search term or browse all stalls.</p><button className="mt-4 text-sm font-semibold text-[#356b42] underline underline-offset-4" onClick={() => setSearch("")}>Clear search</button></div>}
          </div>
          <div id="bag" ref={bagRef} className="scroll-mt-4 lg:mt-[61px]">
            {checkingOut && cartItems.length > 0 && user?.role === "STUDENT"
              ? <Checkout cartItems={cartItems} total={total} user={user} onBack={() => setCheckingOut(false)} onPlaced={handlePlaced} />
              : <Cart cartItems={cartItems} itemCount={itemCount} total={total} changeQuantity={changeQuantity} onCheckout={() => setCheckingOut(true)} demoMode={demoMode} user={user} />}
          </div>
        </div>
      </main>

      {/* On a phone the bag sits below every menu, so this keeps it one tap away. */}
      {itemCount > 0 && !bagOnScreen && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#dce6d8] bg-white/95 px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <a href="#bag" className="mx-auto flex max-w-xl items-center justify-between rounded-xl bg-[#0f2419] px-4 py-3 text-sm font-semibold text-white">
            <span>View bag · {itemCount} item{itemCount === 1 ? "" : "s"}</span>
            <span>₹{total} <span aria-hidden="true">→</span></span>
          </a>
        </div>
      )}
    </>
  );
}
