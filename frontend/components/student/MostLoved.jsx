"use client";

import { useMemo } from "react";
import { mostLoved, useStore } from "../../lib/dishSignals";
import { initials } from "./OrderAgain";
import { stallTint } from "./browse";

function reason(dish) {
  const parts = [];
  if (dish.amazing) parts.push(`${dish.amazing} said amazing`);
  if (dish.keeps) parts.push(`kept ${dish.keeps}× in Deal`);
  return parts.join(" · ");
}

// "Most loved this week": dishes students rated Amazing or kept in Deal me a
// dish over the last seven days (server side: HotService). Tapping one opens
// its stall. Hidden until there's enough to show.
export default function MostLoved({ stalls, onOpenStall }) {
  const loved = useStore(mostLoved);
  const picks = useMemo(() => {
    const byId = new Map();
    for (const stall of stalls) for (const item of stall.items) byId.set(item.id, { item, stall });
    return loved.flatMap((dish) => {
      const found = byId.get(dish.menuItemId);
      return found && found.item.available ? [{ ...found, dish }] : [];
    }).slice(0, 6);
  }, [loved, stalls]);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="most-loved">
      <h2 id="most-loved" className="font-serif text-xl">Most loved this week</h2>
      <p className="mb-2.5 text-[13px] text-muted">From students&apos; &ldquo;Amazing&rdquo; votes and Deal me a dish keeps, last 7 days.</p>
      <ul className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {picks.map(({ item, stall, dish }) => (
          <li key={item.id} className="w-64 shrink-0 sm:w-auto">
            <a href={`/?stall=${stall.id}`} onClick={(event) => { event.preventDefault(); onOpenStall(stall.id); }} className="flex h-full items-center gap-2.5 rounded-2xl border border-line py-2 pr-3 pl-2 hover:bg-[#F6F8F5]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-[15px] text-mint-ink" style={{ background: stallTint(stall) }} aria-hidden="true">{initials(item.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold" title={item.name}>{item.name}</span>
                <span className="block truncate text-xs text-muted">{stall.name} · ₹{item.price}</span>
                <span className="block truncate text-xs text-mint-ink">{reason(dish)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
