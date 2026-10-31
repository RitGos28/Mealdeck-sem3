"use client";

import { useState } from "react";
import BagSheet from "../BagSheet";
import Stepper from "../student/Stepper";

// Remembered on this device: the last size + choices per dish, and the
// portion you usually pick (Half/Full...), to pre-select next time.
const LAST_KEY = "mealdeck.lastChoice";
const PORTION_KEY = "mealdeck.portion";

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not remembered; it still works for this visit.
  }
}

function initialPick(dish) {
  const last = read(LAST_KEY, {})[dish.key];
  const byLabel = (label) => dish.variants.find((v) => v.label === label);
  let variant = last && byLabel(last.label);
  if (!variant) {
    const portion = read(PORTION_KEY, null);
    variant = (portion && dish.variants.find((v) => v.label?.toLowerCase().startsWith(portion.toLowerCase()))) || dish.variants[0];
  }
  const choices = {};
  for (const group of variant.item.choices ?? []) {
    const remembered = last?.choices?.[group.name];
    if (remembered && group.options.includes(remembered)) choices[group.name] = remembered;
  }
  return { variant, choices };
}

// Zomato-style customise sheet: pick a size (when the dish has several)
// and every free choice (Bread, Dry/Gravy...), then add. All choices are
// required and none are pre-filled the first time, so the stall never gets
// a default the student didn't mean. `lastLine` is this dish's most recent
// bag line, offered as "Repeat last".
export default function CustomiseSheet({ dish, lastLine, onAdd, onClose }) {
  const [pick, setPick] = useState(() => initialPick(dish));
  const [quantity, setQuantity] = useState(1);
  const item = pick.variant.item;
  const groups = item.choices ?? [];
  const missing = groups.filter((group) => !pick.choices[group.name]);
  const available = item.available !== false;

  function add(variant, choices, qty) {
    write(LAST_KEY, { ...read(LAST_KEY, {}), [dish.key]: { label: variant.label, choices } });
    const word = variant.label?.split(/[\s,]/)[0];
    if (dish.variants.length > 1 && word) write(PORTION_KEY, word);
    onAdd(variant.item, choices, qty);
    onClose();
  }

  return (
    <BagSheet onClose={onClose} label={`Customise ${dish.base}`}>
      <div className="space-y-5 pb-2">
        <div>
          <h2 className="font-serif text-2xl leading-tight">{dish.base}</h2>
          {dish.category && <p className="text-sm text-muted">{dish.category}</p>}
        </div>

        {lastLine && (
          <button type="button" onClick={() => add(dish.variants.find((v) => v.item.id === lastLine.item.id) ?? pick.variant, lastLine.choices ?? {}, 1)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-deck/30 bg-mint px-4 py-3 text-left">
            <span className="min-w-0"><span className="block text-xs font-semibold tracking-[.04em] text-mint-ink uppercase">Repeat last</span><span className="block truncate text-sm font-medium">{[dish.variants.length > 1 ? dish.variants.find((v) => v.item.id === lastLine.item.id)?.label : null, ...Object.values(lastLine.choices ?? {})].filter(Boolean).join(" · ") || dish.base}</span></span>
            <span className="shrink-0 rounded-full bg-deck px-3 py-1.5 text-sm font-semibold text-white">Add again</span>
          </button>
        )}

        {dish.variants.length > 1 && (
          <fieldset>
            <legend className="mb-2 flex w-full justify-between text-sm font-semibold"><span>Size</span><span className="text-xs font-medium text-muted">Required</span></legend>
            {dish.variants.map((variant) => (
              <label key={variant.item.id} className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 ${variant.item.available === false ? "opacity-50" : "cursor-pointer hover:bg-[#F6F8F5]"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="size" checked={pick.variant === variant} disabled={variant.item.available === false} onChange={() => setPick({ variant, choices: pick.choices })} className="size-5 accent-[#163D29]" />
                  <span className="text-[15px]">{variant.label}{variant.item.available === false ? " · sold out" : ""}</span>
                </span>
                <span className="text-[15px] font-medium tabular-nums">₹{variant.item.price}</span>
              </label>
            ))}
          </fieldset>
        )}

        {groups.map((group) => (
          <fieldset key={group.name}>
            <legend className="mb-2 flex w-full justify-between text-sm font-semibold"><span>{group.name}</span><span className="text-xs font-medium text-muted">Pick one</span></legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const on = pick.choices[group.name] === option;
                return (
                  <button key={option} type="button" aria-pressed={on} onClick={() => setPick({ variant: pick.variant, choices: { ...pick.choices, [group.name]: option } })} className={`min-h-11 rounded-full px-4 text-[15px] transition-colors ${on ? "bg-deck font-semibold text-white" : "border border-field font-medium text-ink hover:border-deck"}`}>
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex items-center gap-3 pt-1">
          <Stepper name={dish.base} quantity={quantity} onChange={(delta) => setQuantity((q) => Math.max(1, q + delta))} />
          <button type="button" disabled={missing.length > 0 || !available} onClick={() => add(pick.variant, pick.choices, quantity)} className="flex h-12 flex-1 items-center justify-center rounded-full bg-deck px-4 font-semibold text-white hover:bg-deck-hover disabled:opacity-50">
            {!available ? "Sold out" : missing.length ? `Pick ${missing[0].name.toLowerCase()}` : `Add item · ₹${item.price * quantity}`}
          </button>
        </div>
      </div>
    </BagSheet>
  );
}
