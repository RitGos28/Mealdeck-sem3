"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import MenuItemCard from "./MenuItemCard";
import { bagCount, groupDishes } from "../../lib/menuDishes";

// Phones start a big menu with its categories folded, so a stall with 150
// dishes is a short list of headings rather than a very long scroll.
const FOLD_OVER = 12;

// How many unfinished orders the stall has right now, from its live queue
// snapshot. Null while loading, on error, in demo mode, or when the stall
// isn't taking orders (the chip says why instead).
export function useQueueLength(stall, demoMode) {
  const [length, setLength] = useState(null);
  const skip = demoMode || stall.closedToday || stall.ordersPaused;
  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    api(`/api/stalls/${stall.id}/queue`).then(
      (snapshot) => { if (!cancelled && Array.isArray(snapshot?.orders)) setLength(snapshot.orders.length); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [stall.id, skip]);
  return skip ? null : length;
}

function StallMeta({ stall, queueLength }) {
  if (stall.closedToday) return <span className="shrink-0 rounded-full bg-[#F0F2EF] px-2.5 py-1 text-xs font-semibold text-muted">Closed today</span>;
  if (stall.ordersPaused) return <span className="shrink-0 rounded-full bg-[#FBEDE6] px-2.5 py-1 text-xs font-semibold text-danger">Paused</span>;
  if (queueLength === null) return null;
  return <span className="shrink-0 text-[13px] text-muted">{queueLength === 0 ? "No queue" : `${queueLength} in queue`}</span>;
}

// Items in the order the stall listed them, grouped by category; items
// without one go in a single unnamed group, listed last.
function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.category ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "") - (b === ""))
    .map(([name, groupItems]) => ({ name, items: groupItems }));
}

function Chevron({ open }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;
}

function Arrow({ direction, onClick, hidden }) {
  return (
    <button type="button" onClick={onClick} tabIndex={-1} aria-hidden="true" className={`absolute top-[38px] z-10 hidden size-9 items-center justify-center rounded-full border border-line bg-white text-xl text-ink shadow-[0_8px_20px_-8px_rgba(20,40,30,.35)] hover:bg-mint lg:flex ${direction < 0 ? "-left-4" : "-right-4"} ${hidden ? "lg:hidden" : ""}`}>
      {direction < 0 ? "‹" : "›"}
    </button>
  );
}

// One run of dishes: a list on phones and tablets, a sideways-scrolling row
// of cards on wide screens, with arrows only when there's more to see.
function ItemRow({ stall, items, demoMode, cart, onAddToCart, onChangeQuantity }) {
  const rowRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => setEdges({ start: row.scrollLeft <= 4, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4 });
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  const scrollBy = (direction) => rowRef.current?.scrollBy({ left: direction * rowRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <Arrow direction={-1} onClick={() => scrollBy(-1)} hidden={edges.start} />
      <ul ref={rowRef} className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:-mx-1 lg:flex lg:snap-x lg:gap-3 lg:overflow-x-auto lg:scroll-smooth lg:px-1 lg:pt-1 lg:pb-3 lg:[scrollbar-width:thin]">
        {groupDishes(items).map((dish) => (
          <li key={dish.key} className="lg:w-[172px] lg:shrink-0 lg:snap-start">
            <MenuItemCard
              dish={dish}
              demoMode={demoMode}
              quantity={bagCount(cart, dish)}
              onAddToCart={() => onAddToCart(dish, stall)}
              onChangeQuantity={(delta) => onChangeQuantity(dish.items[0].id, delta)}
            />
          </li>
        ))}
      </ul>
      <Arrow direction={1} onClick={() => scrollBy(1)} hidden={edges.end} />
    </div>
  );
}

// `expandAll` (set while searching or filtering) opens everything, so a
// match is never hidden inside a folded group. `bare` drops the stall's own
// heading, for the stall page where the band already names it.
export default function MenuSection({ stall, demoMode, cart, onAddToCart, onChangeQuantity, expandAll = false, isDesktop = false, bare = false }) {
  const queueLength = useQueueLength(stall, demoMode);
  const headingId = `stall-${stall.id}`;
  const [stallOpen, setStallOpen] = useState(true);
  const groups = groupByCategory(stall.items);
  const named = groups.some((group) => group.name);
  // Category folding is a phone/tablet thing; wide screens show compact rows.
  const foldable = named && !isDesktop && stall.items.length > FOLD_OVER;
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const open = stallOpen || expandAll || bare;

  function toggleGroup(name) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <section id={`menu-${stall.id}`} aria-labelledby={headingId} className="mt-6 scroll-mt-6 first:mt-0 lg:mt-7">
      <div className={`flex items-center justify-between gap-3 border-b border-line pb-1.5 lg:mb-2 lg:border-0 lg:pb-0 ${bare ? "sr-only" : ""}`}>
        <h2 id={headingId} className="min-w-0">
          <button type="button" onClick={() => setStallOpen((value) => !value)} aria-expanded={open} className="-ml-1 flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-left font-serif text-[22px] leading-tight hover:text-deck lg:min-h-9 lg:text-xl">
            {stall.name}
            <Chevron open={open} />
          </button>
        </h2>
        <span className="flex items-center gap-3">
          {!open && <span className="text-[13px] text-muted">{stall.items.length} dishes</span>}
          <StallMeta stall={stall} queueLength={queueLength} />
        </span>
      </div>

      {open && (named ? groups.map((group) => {
        const label = group.name || "More";
        const groupOpen = !foldable || expandAll || openGroups.has(group.name);
        return (
          <div key={group.name} className="mt-2 lg:mt-3">
            {foldable ? (
              <button type="button" onClick={() => toggleGroup(group.name)} aria-expanded={groupOpen} className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-[#EEF1ED] text-left">
                <span className="text-[15px] font-semibold">{label}</span>
                <span className="flex items-center gap-2 text-[13px] text-muted">{groupDishes(group.items).length}<Chevron open={groupOpen} /></span>
              </button>
            ) : (
              <h3 className="mt-3 mb-1 text-xs font-semibold tracking-[.04em] text-muted uppercase lg:mt-0 lg:mb-1.5 lg:text-[11px]">{label} <span className="font-normal normal-case">· {groupDishes(group.items).length}</span></h3>
            )}
            {groupOpen && <ItemRow stall={stall} items={group.items} demoMode={demoMode} cart={cart} onAddToCart={onAddToCart} onChangeQuantity={onChangeQuantity} />}
          </div>
        );
      }) : <ItemRow stall={stall} items={stall.items} demoMode={demoMode} cart={cart} onAddToCart={onAddToCart} onChangeQuantity={onChangeQuantity} />)}
    </section>
  );
}
