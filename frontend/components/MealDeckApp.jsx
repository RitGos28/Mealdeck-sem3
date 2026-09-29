"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import MenuSection from "../components/menu/MenuSection";
import Cart from "../components/cart/Cart";
import Checkout from "../components/checkout/Checkout";

export default function MenuExperience({ stalls, demoMode }) {
  const router = useRouter();
  const [cart, setCart] = useState({});
  const [checkingOut, setCheckingOut] = useState(false);
  const menuStalls = stalls.map((stall) => ({
    ...stall,
    items: stall.items.map((item) => ({
      ...item,
      image: item.image ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    })),
  }));

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemCount = cartItems.reduce((count, entry) => count + entry.quantity, 0);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

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

  function handlePlaced(orderIds) {
    setCart({});
    setCheckingOut(false);
    router.push(`/orders?ids=${orderIds.join(",")}`);
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
      <main className="mx-auto w-full max-w-6xl px-5 py-7 pb-16 sm:px-6 sm:py-10">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#173725] px-6 py-8 text-white shadow-[0_20px_55px_-28px_rgba(17,55,35,.7)] sm:px-9 sm:py-10">
          <div className="absolute -right-12 -top-20 size-64 rounded-full bg-[#a8dc78]/20 blur-2xl" />
          <div className="relative max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#c9e8a9]">Campus food, without the wait</p>
            <h1 className="font-display mb-3 text-4xl font-bold tracking-tight sm:text-5xl">Today&apos;s menu,<br />ready when you are.</h1>
            <p className="max-w-md text-sm leading-6 text-white/75 sm:text-base">See what&apos;s available, order ahead, and pick up at the time that suits you.</p>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-2 text-xs font-semibold text-[#d9edcb]"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">● Live availability</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">◷ Quick pickup</span></div>
        </section>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold tracking-tight">Explore the stalls</h2><p className="mt-1 text-sm text-gray-500">Fresh picks from around campus.</p></div><p className="rounded-full border border-[#dce5d8] bg-white px-3 py-1.5 text-xs font-semibold text-[#477355]">{menuStalls.length} stalls open</p></div>

        {demoMode && <p className="mb-6 rounded-xl border border-[#dbead6] bg-[#f5faf3] px-4 py-3 text-sm text-[#3f6b3a]">Showing sample menu data. Start the backend later to load live availability.</p>}
        {!demoMode && menuStalls.length === 0 && <p className="py-10 text-gray-500">No stalls yet.</p>}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {menuStalls.map((stall) => <MenuSection key={stall.id} stall={stall} demoMode={demoMode} onAddToCart={addToCart} />)}
          </div>
          {checkingOut && cartItems.length > 0
            ? <Checkout cartItems={cartItems} total={total} onBack={() => setCheckingOut(false)} onPlaced={handlePlaced} />
            : <Cart cartItems={cartItems} itemCount={itemCount} total={total} changeQuantity={changeQuantity} onCheckout={() => setCheckingOut(true)} demoMode={demoMode} />}
        </div>
      </main>
    </>
  );
}
