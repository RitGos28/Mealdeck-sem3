"use client";

import { useMemo, useState } from "react";
import Header from "../components/layout/Header";
import MenuSection from "../components/menu/MenuSection";
import Cart from "../components/cart/Cart";

export default function MenuExperience({ stalls, demoMode }) {
  const [cart, setCart] = useState({});
  const menuStalls = stalls.map((stall) => ({
    ...stall,
    items: stall.items.map((item) => ({
      ...item,
      image: item.image ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    })),
  }));

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemCount = cartItems.reduce((count, entry) => count + entry.quantity, 1);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  function addToCart(item) {
    setCart((current) => ({
      ...current,
      [item.id]: {
        item,
        quantity: (current[item.id]?.quantity ?? 0) + 1,
      },
    }));
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
      <main className="mx-auto w-full max-w-6xl px-6 py-8 pb-16">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">Today&apos;s Menu</h1>
            <p className="text-gray-500">Live availability, reported by students.</p>
          </div>
        </div>

        {demoMode && <p className="mb-6 rounded-xl border border-[#dbead6] bg-[#f5faf3] px-4 py-3 text-sm text-[#3f6b3a]">Showing sample menu data. Start the backend later to load live availability.</p>}
        {!demoMode && menuStalls.length === 0 && <p className="py-10 text-gray-500">No stalls yet.</p>}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {menuStalls.map((stall) => <MenuSection key={stall.id} stall={stall} demoMode={demoMode} onAddToCart={addToCart} />)}
          </div>
          <Cart cartItems={cartItems} itemCount={itemCount} total={total} changeQuantity={changeQuantity} />
        </div>
      </main>
    </>
  );
}
