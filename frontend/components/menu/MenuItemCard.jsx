"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import Stepper from "../student/Stepper";
import { initials } from "../student/OrderAgain";
import { needsSheet } from "../../lib/menuDishes";

// The Indian veg / non-veg mark: dot for veg, triangle for non-veg.
function VegDot({ veg }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} className={`shrink-0 ${veg ? "text-veg" : "text-nonveg"}`}>
      <rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {veg ? <circle cx="7" cy="7" r="3" fill="currentColor" /> : <path d="M7 3.6L10.4 10H3.6Z" fill="currentColor" />}
    </svg>
  );
}

function Thumb({ item, dimmed }) {
  const [failed, setFailed] = useState(false);
  const fade = dimmed ? "opacity-50 grayscale" : "";
  if (item.image && !failed) {
    return <Image src={item.image} alt="" width={480} height={300} sizes="(min-width: 1024px) 180px, 50px" onError={() => setFailed(true)} className={`size-[50px] shrink-0 rounded-full bg-mint object-cover lg:h-28 lg:w-full lg:rounded-none ${fade}`} />;
  }
  return <span className={`flex size-[50px] shrink-0 items-center justify-center rounded-full bg-mint font-serif text-lg text-mint-ink lg:h-28 lg:w-full lg:rounded-none lg:text-3xl ${fade}`} aria-hidden="true">{initials(item.name)}</span>;
}

// One dish as a list row: thumbnail, veg mark, name, price, and an add
// button (or the quantity stepper once it's in the bag).
// `sub` names the stall when dishes from several stalls share one list.
// `dish` (lib/menuDishes) groups sizes and carries free choices: a dish with
// either shows "from ₹…", a hint, and an Add button that opens the
// customise sheet; quantity is then the dish's total in the bag.
export default function MenuItemCard({ item: itemProp, dish, demoMode, quantity = 0, onAddToCart, onChangeQuantity, sub }) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const [locallyUnavailable, setLocallyUnavailable] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);
  const items = dish ? dish.items : [itemProp];
  const item = items.find((candidate) => candidate.available) ?? items[0];
  const name = dish ? dish.base : item.name;
  const sized = items.length > 1;
  const custom = dish ? needsSheet(dish) : false;
  const available = items.some((candidate) => candidate.available) && !locallyUnavailable;
  const minPrice = Math.min(...items.map((candidate) => Number(candidate.price)));
  const vegKinds = [...new Set(items.map((candidate) => candidate.veg))];
  const hint = [sized ? dish.variants.map((v) => v.label).join(" · ") : null, ...(item.choices ?? []).map((group) => group.options.join(" or "))].filter(Boolean).join(" · ");

  async function handleReport() {
    if (demoMode) {
      setLocallyUnavailable(true);
      return;
    }
    setReporting(true);
    setReportMessage(null);
    try {
      await api(`/api/menu-items/${item.id}/report`, { method: "POST" });
      setReportMessage("Thanks, reported.");
      router.refresh();
    } catch (err) {
      // Reporting needs a student login; anyone else gets 401/403.
      if (err.status === 401 || err.status === 403) {
        router.push("/login?next=/");
        return;
      }
      setReportMessage(err.message);
    } finally {
      setReporting(false);
    }
  }

  return (
    // A list row on phones and tablets; a photo card on wide screens.
    <div className="-mx-2 flex min-h-[70px] items-center gap-3.5 border-b border-[#EEF1ED] px-2 py-2.5 transition-colors hover:bg-[#F6F8F5] lg:relative lg:mx-0 lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:p-0 lg:hover:bg-white lg:hover:shadow-[0_12px_30px_-18px_rgba(20,60,38,.45)]">
      <Thumb item={item} dimmed={!available} />
      <div className="flex min-w-0 flex-1 items-center gap-3.5 lg:px-3 lg:pt-6 lg:pb-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {vegKinds.map((veg) => <VegDot key={String(veg)} veg={veg} />)}
          <span className={`text-[15px] font-medium lg:line-clamp-2 lg:text-[13.5px] lg:leading-snug ${available ? "text-ink" : "text-muted"}`}>{name}</span>
        </div>
        {sub && <p className="mt-0.5 truncate text-[13px] text-muted">{sub}</p>}
        {custom && hint && <p className="mt-0.5 truncate text-[13px] text-mint-ink">{hint}</p>}
        {available ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3">
            <span className="text-sm text-muted lg:text-[13px] lg:font-semibold lg:text-ink">{sized ? `from ₹${minPrice}` : `₹${item.price}`}</span>
            {/* A size group spans several items, so sold-out is reported per size by the stall instead. */}
            {!sized && (
              <button type="button" className="-my-2 py-2 text-left text-xs text-muted underline-offset-2 hover:text-ink hover:underline disabled:cursor-default disabled:opacity-60" disabled={reporting} onClick={handleReport}>
                {reporting ? "Reporting…" : "Report out of stock"}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-muted">Sold out today</p>
        )}
        {reportMessage && <p className="mt-0.5 text-xs text-muted" role="status">{reportMessage}</p>}
      </div>
      {available && (
        // On wide-screen cards it sits on the photo's bottom corner.
        <div className="shrink-0 lg:absolute lg:top-[calc(7rem-1.375rem)] lg:right-2.5 lg:origin-right lg:scale-[.82] lg:rounded-full lg:bg-white lg:shadow-[0_6px_16px_-6px_rgba(20,40,30,.35)]">
          {custom ? (
            <div className="flex flex-col items-center gap-0.5">
              <button type="button" onClick={onAddToCart} aria-label={`Add ${name}, choose options`} className="flex h-10 shrink-0 items-center rounded-full border border-deck bg-white px-4 text-sm font-semibold text-deck transition-colors hover:bg-mint">Add</button>
              {quantity > 0 && <span className="text-[11px] font-semibold text-deck">{quantity} in bag</span>}
            </div>
          ) : quantity > 0
            ? <Stepper name={name} quantity={quantity} onChange={onChangeQuantity} />
            : <button type="button" onClick={onAddToCart} aria-label={`Add ${name}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-field bg-white text-xl text-ink transition-colors hover:border-deck hover:bg-mint">+</button>}
        </div>
      )}
      </div>
    </div>
  );
}
