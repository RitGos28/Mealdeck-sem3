"use client";

import BagSheet from "../BagSheet";
import { VegDot } from "./MenuItemCard";
import PreorderAsk from "../student/PreorderAsk";

// Every size and option of a dish, read-only, for a stall that isn't taking
// pre-orders on MealDeck yet: the student can see all the varieties and
// prices, and the button says why it can't be added.
export default function DishDetailSheet({ dish, stall, onClose }) {
  const vegKinds = [...new Set(dish.items.map((item) => item.veg))];
  // Choices can differ by size, so show each group once (name and options).
  const groups = [];
  for (const item of dish.items) {
    for (const group of item.choices ?? []) {
      if (!groups.some((g) => g.name === group.name && g.options.join("|") === group.options.join("|"))) groups.push(group);
    }
  }
  const sized = dish.variants.length > 1;

  return (
    <BagSheet onClose={onClose} label={`${dish.base} details`}>
      <div className="space-y-5 pb-2">
        <div>
          <div className="flex items-center gap-2">
            {vegKinds.map((veg) => <VegDot key={String(veg)} veg={veg} />)}
            <h2 className="font-serif text-2xl leading-tight">{dish.base}</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted">{[stall.name, dish.category].filter(Boolean).join(" · ")}</p>
        </div>

        <section aria-label={sized ? "Sizes and prices" : "Price"}>
          {sized && <h3 className="mb-1 text-sm font-semibold">Sizes</h3>}
          <ul>
            {dish.variants.map((variant) => (
              <li key={variant.item.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-line py-2 last:border-b-0">
                <span className={`text-[15px] ${variant.item.available === false ? "text-muted" : ""}`}>{variant.label ?? dish.base}{variant.item.available === false ? " · sold out today" : ""}</span>
                <span className="text-[15px] font-medium tabular-nums">₹{variant.item.price}</span>
              </li>
            ))}
          </ul>
        </section>

        {groups.map((group) => (
          <section key={group.name} aria-label={group.name}>
            <h3 className="mb-2 text-sm font-semibold">{group.name} <span className="text-xs font-medium text-muted">you pick one when ordering</span></h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => <span key={option} className="min-h-9 rounded-full border border-field px-3.5 py-1.5 text-[15px]">{option}</span>)}
            </div>
          </section>
        ))}

        <div>
          <button type="button" disabled className="flex h-12 w-full items-center justify-center rounded-full bg-deck px-4 font-semibold text-white disabled:opacity-50">
            {stall.name} isn&apos;t taking pre-orders yet
          </button>
          <p className="mt-2 text-center text-xs text-muted">Order at the counter for now.</p>
          <PreorderAsk stall={stall} className="mt-3 flex flex-col items-center text-center" />
        </div>
      </div>
    </BagSheet>
  );
}
