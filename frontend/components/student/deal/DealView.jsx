"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import MenuItemCard from "../../menu/MenuItemCard";
import { bagCount, dishFor } from "../../../lib/menuDishes";
import { initials } from "../OrderAgain";
import { BackLink } from "../BrowseViews";
import { stallStatus, stallTint } from "../browse";
import { DEFAULT_FILTERS, HAND_SIZE, dealHand, dealPool, filterSummary } from "./dealPool";

// "Deal me a dish": an optional minigame for when you can't decide. Ten
// dish cards, one at a time; keep or skip each, then order from your hand.

const FILTERS_KEY = "mealdeck.dealFilters";
const DEAL_KEY = "mealdeck.deal";

function read(storage, key) {
  try {
    return JSON.parse(window[storage].getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    window[storage].setItem(key, JSON.stringify(value));
  } catch {
    // Not saved; the game still works for this visit.
  }
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The game's state. The dealt hand is kept for this tab (by ids, matched
// back to the live menu), so going to the bag or the login page and coming
// back doesn't lose it; the filters are remembered on this device.
export function useDeal(stalls, demoMode) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [saved, setSaved] = useState({ phase: "setup", hand: [], index: 0, kept: [], history: [] });

  useEffect(() => {
    const storedFilters = read("localStorage", FILTERS_KEY);
    if (storedFilters) setFilters({ ...DEFAULT_FILTERS, ...storedFilters }); // eslint-disable-line react-hooks/set-state-in-effect
    const storedDeal = read("sessionStorage", DEAL_KEY);
    if (storedDeal?.hand?.length) setSaved(storedDeal);
  }, []);

  const lookup = useMemo(() => {
    const map = new Map();
    for (const stall of stalls) for (const item of stall.items) map.set(item.id, { item, stall });
    return map;
  }, [stalls]);

  // Dishes taken off the menu since the deal are quietly dropped.
  const hand = saved.hand.map((id) => lookup.get(id)).filter(Boolean);
  const kept = saved.kept.map((id) => lookup.get(id)).filter(Boolean);
  const pool = useMemo(() => dealPool(stalls, filters, demoMode), [stalls, filters, demoMode]);

  function update(next) {
    setSaved(next);
    write("sessionStorage", DEAL_KEY, next);
  }

  function changeFilters(next) {
    setFilters(next);
    write("localStorage", FILTERS_KEY, next);
  }

  function start() {
    const dealt = dealHand(pool);
    update({ phase: dealt.length ? "dealing" : "setup", hand: dealt.map(({ item }) => item.id), index: 0, kept: [], history: [] });
  }

  // keep: true to keep the current card, false to skip it.
  function decide(keep) {
    const current = hand[saved.index];
    if (!current) return;
    const index = saved.index + 1;
    update({
      ...saved,
      index,
      phase: index >= hand.length ? "hand" : "dealing",
      kept: keep && !saved.kept.includes(current.item.id) ? [...saved.kept, current.item.id] : saved.kept,
      history: [...saved.history, { keep }],
    });
  }

  function undo() {
    if (saved.index === 0) return;
    const last = saved.history.at(-1);
    const previous = hand[saved.index - 1];
    update({
      ...saved,
      phase: "dealing",
      index: saved.index - 1,
      kept: last?.keep ? saved.kept.filter((id) => id !== previous?.item.id) : saved.kept,
      history: saved.history.slice(0, -1),
    });
  }

  return {
    filters, changeFilters, pool, hand, kept,
    phase: saved.phase, index: saved.index,
    current: hand[saved.index] ?? null,
    upcoming: hand.slice(saved.index + 1, saved.index + 3),
    start, decide, undo,
    showHand: () => update({ ...saved, phase: "hand" }),
    resume: () => update({ ...saved, phase: saved.index < hand.length ? "dealing" : "hand" }),
    reset: () => update({ phase: "setup", hand: [], index: 0, kept: [], history: [] }),
  };
}

function VegMark({ veg }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} className={veg ? "text-veg" : "text-nonveg"}>
      <rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {veg ? <circle cx="7" cy="7" r="3" fill="currentColor" /> : <path d="M7 3.6L10.4 10H3.6Z" fill="currentColor" />}
    </svg>
  );
}

function Corner({ item, flip = false }) {
  return (
    <div aria-hidden="true" className={`absolute flex flex-col items-center gap-1 text-ink ${flip ? "right-3.5 bottom-3 rotate-180" : "top-3 left-3.5"}`}>
      <span className="font-serif text-xl leading-none">₹{item.price}</span>
      <VegMark veg={item.veg} />
    </div>
  );
}

// One playing-card dish. Drag it right to keep, left to skip.
function DishCard({ entry, demoMode, onDecide }) {
  const { item, stall } = entry;
  const status = stallStatus(stall, demoMode);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);

  function finish(keep) {
    if (reducedMotion()) {
      onDecide(keep);
      return;
    }
    setLeaving(keep ? 1 : -1);
    setTimeout(() => onDecide(keep), 220);
  }

  function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    start.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (start.current !== null) setDrag(event.clientX - start.current);
  }

  function onPointerUp() {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(drag) > 90) finish(drag > 0);
    else setDrag(0);
  }

  const x = leaving ? leaving * 520 : drag;
  const hint = leaving || (Math.abs(drag) > 40 ? Math.sign(drag) : 0);

  return (
    <article
      aria-label={`${item.name}, ₹${item.price}, ${stall.name}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, transition: dragging ? "none" : "transform .22s ease-out" }}
      className="absolute inset-x-0 top-0 mx-auto flex h-[clamp(260px,calc(100svh-322px),420px)] w-full max-w-[300px] cursor-grab touch-pan-y flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_22px_40px_-18px_rgba(20,60,38,.55)] select-none active:cursor-grabbing"
    >
      <Corner item={item} />
      <Corner item={item} flip />
      <div className="mx-[54px] mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[18px]" style={{ background: stallTint(stall) }}>
        {item.image
          ? <Image src={item.image} alt="" width={384} height={376} draggable={false} className="size-full object-cover" />
          : <span className="flex aspect-square h-3/5 max-h-28 items-center justify-center rounded-full bg-white font-serif text-4xl text-mint-ink" aria-hidden="true">{initials(item.name)}</span>}
      </div>
      <div className="shrink-0 px-6 pt-4 pb-12 text-center">
        <p className="truncate text-xs font-semibold tracking-[.05em] text-mint-ink uppercase">{stall.name}{item.category ? ` · ${item.category}` : ""}</p>
        <h2 className="mt-2 line-clamp-2 font-serif text-[28px] leading-[1.1]">{item.name}</h2>
        <p className="mt-2 text-[13px] text-muted">{status.label}</p>
      </div>
      {hint !== 0 && (
        <span aria-hidden="true" className={`absolute top-6 rounded-lg border-2 px-2 py-0.5 text-sm font-bold tracking-[.08em] uppercase ${hint > 0 ? "left-1/2 -translate-x-1/2 border-deck text-deck" : "left-1/2 -translate-x-1/2 border-danger text-danger"}`}>
          {hint > 0 ? "Keep" : "Skip"}
        </span>
      )}
    </article>
  );
}

function RoundButton({ label, caption, onClick, primary = false, small = false, disabled = false, children }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 text-xs ${primary ? "font-semibold text-deck" : "text-muted"}`}>
      <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={`flex items-center justify-center rounded-full shadow-[0_10px_22px_-14px_rgba(20,60,38,.6)] transition-colors disabled:opacity-40 ${small ? "size-12" : "size-16"} ${primary ? "bg-deck text-white hover:bg-deck-hover" : "border-[1.5px] border-field bg-white text-ink hover:border-deck"}`}>
        {children}
      </button>
      {caption}
    </div>
  );
}

const Glyph = {
  undo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>,
  skip: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  keep: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.7 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.3 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" /></svg>,
};

function Toggle({ pressed, onClick, children }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`h-10 rounded-full px-4 text-sm transition-colors ${pressed ? "bg-deck font-semibold text-white" : "border border-field font-medium text-ink hover:border-deck"}`}>
      {children}
    </button>
  );
}

function Setup({ deal }) {
  const { filters, changeFilters, pool } = deal;
  const set = (change) => changeFilters({ ...filters, ...change });
  return (
    <section aria-label="Deal settings" className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Toggle pressed={filters.vegOnly} onClick={() => set({ vegOnly: !filters.vegOnly })}>Veg only</Toggle>
        <Toggle pressed={filters.under150} onClick={() => set({ under150: !filters.under150 })}>Under ₹150</Toggle>
      </div>
      <div role="group" aria-label="Deal" className="flex rounded-full bg-[#F0F3EF] p-[3px] sm:max-w-sm">
        {[["food", "Food"], ["drinks", "Drinks"], ["both", "Both"]].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filters.kind === id} onClick={() => set({ kind: id })} className={`h-10 flex-1 rounded-full text-sm ${filters.kind === id ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "font-medium text-muted hover:text-ink"}`}>{label}</button>
        ))}
      </div>
      <p className="text-sm text-muted">{pool.length === 0 ? "No open stall has a dish that fits. Try fewer filters." : `${pool.length} dishes at open stalls to deal from.`}</p>
      <button type="button" onClick={deal.start} disabled={pool.length === 0} className="h-13 w-full rounded-full bg-deck text-base font-semibold text-white hover:bg-deck-hover disabled:opacity-50 sm:max-w-sm">
        Deal me {Math.min(HAND_SIZE, pool.length) || HAND_SIZE} dishes
      </button>
      <p className="text-[13px] text-muted">Swipe right to keep, left to skip. Arrow keys work too.</p>
    </section>
  );
}

function Dealing({ deal, demoMode, onBag }) {
  const { current, upcoming } = deal;

  useEffect(() => {
    function onKey(event) {
      if (event.target.closest?.("input, textarea, select")) return;
      if (event.key === "ArrowRight") deal.decide(true);
      if (event.key === "ArrowLeft") deal.decide(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!current) return null;
  return (
    <section aria-label="Dealing">
      <div className="relative h-[clamp(276px,calc(100svh-306px),436px)]">
        {upcoming.map((entry, i) => (
          <div key={entry.item.id} aria-hidden="true" className="absolute inset-x-0 top-0 mx-auto h-[clamp(260px,calc(100svh-322px),420px)] w-full max-w-[300px] rounded-3xl border border-line shadow-[0_10px_24px_-14px_rgba(20,60,38,.45)]" style={{ background: stallTint(entry.stall), transform: `translate(${i === 0 ? -10 : 14}px, ${i === 0 ? 4 : 8}px) rotate(${i === 0 ? -4 : 6}deg)`, zIndex: -i }} />
        ))}
        <DishCard key={current.item.id} entry={current} demoMode={demoMode} onDecide={deal.decide} />
      </div>
      <div className="mt-2 flex items-start justify-center gap-5">
        <RoundButton label="Undo last card" caption="Undo" small onClick={deal.undo} disabled={deal.index === 0}>{Glyph.undo}</RoundButton>
        <RoundButton label={`Skip ${current.item.name}`} caption="Skip" onClick={() => deal.decide(false)}>{Glyph.skip}</RoundButton>
        <RoundButton label={`Keep ${current.item.name}`} caption="Keep" primary onClick={() => deal.decide(true)}>{Glyph.keep}</RoundButton>
        <RoundButton label={`Add ${current.item.name} to bag now`} caption="Bag it" small onClick={() => onBag(current.item, current.stall, () => deal.decide(true))}><span className="text-2xl leading-none">+</span></RoundButton>
      </div>
      {deal.kept.length > 0 && (
        <button type="button" onClick={deal.showHand} className="mx-auto mt-4 flex h-11 items-center rounded-full px-4 text-sm font-semibold text-deck underline underline-offset-4 hover:bg-mint">See your hand ({deal.kept.length})</button>
      )}
    </section>
  );
}

function Hand({ deal, demoMode, cart, onAdd, onChangeQuantity, onHome }) {
  const groups = [];
  for (const entry of deal.kept) {
    const group = groups.find((g) => g.stall.id === entry.stall.id);
    if (group) group.items.push(entry.item); else groups.push({ stall: entry.stall, items: [entry.item] });
  }
  const busiest = [...groups].sort((a, b) => b.items.length - a.items.length)[0];
  return (
    <section aria-label="Your hand" className="space-y-4">
      {deal.kept.length === 0 && <p className="rounded-2xl border border-dashed border-field px-6 py-10 text-center text-muted">You skipped every card. Deal again with other filters?</p>}
      {busiest && busiest.items.length >= 2 && groups.length > 1 && (
        <p className="rounded-xl bg-mint px-3 py-2.5 text-[13px] text-mint-ink">{busiest.items.length} of your picks are at {busiest.stall.name}, so one pickup covers them.</p>
      )}
      {groups.map(({ stall, items }) => (
        <div key={stall.id}>
          <p className="text-xs font-semibold tracking-[.05em] text-muted uppercase">{stall.name}</p>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <MenuItemCard item={item} dish={dishFor(item)} demoMode={demoMode} sub={item.category} quantity={bagCount(cart, dishFor(item))} onAddToCart={() => onAdd(item, stall)} onChangeQuantity={(delta) => onChangeQuantity(item.id, delta)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={deal.reset} className="h-12 rounded-full bg-deck px-6 font-semibold text-white hover:bg-deck-hover">Deal again</button>
        <button type="button" onClick={onHome} className="h-12 rounded-full border border-field px-6 font-semibold text-ink hover:border-deck">Back to home</button>
      </div>
    </section>
  );
}

export function DealBody({ deal, demoMode, cart, onAdd, onChangeQuantity, onHome }) {
  if (deal.phase === "dealing" && deal.current) return <Dealing deal={deal} demoMode={demoMode} onBag={onAdd} />;
  if (deal.phase === "hand") return <Hand deal={deal} demoMode={demoMode} cart={cart} onAdd={onAdd} onChangeQuantity={onChangeQuantity} onHome={onHome} />;
  return <Setup deal={deal} />;
}

function Fan({ kept }) {
  const shown = kept.slice(0, 7);
  const mid = (shown.length - 1) / 2;
  return (
    <div aria-hidden="true" className="relative mt-1.5 h-[118px]">
      {shown.map(({ item, stall }, i) => (
        <div key={item.id} className="absolute top-0 left-1/2 flex h-[100px] w-[74px] flex-col items-start justify-center gap-1.5 rounded-xl pl-2 border border-line bg-white shadow-[0_10px_18px_-10px_rgba(0,0,0,.45)]" style={{ marginLeft: -37 + (i - mid) * 46, marginTop: Math.abs(i - mid) * 6, transform: `rotate(${(i - mid) * 7}deg)`, zIndex: i }}>
          <span className="flex size-10 items-center justify-center rounded-full font-serif text-sm text-mint-ink" style={{ background: stallTint(stall) }}>{initials(item.name)}</span>
          <span className="text-[11px] font-semibold text-ink">₹{item.price}</span>
        </div>
      ))}
    </div>
  );
}

// The deal view's heading: on the green band on phones, atop the column on
// desktop.
export function DealHeading({ deal, onHome, onBand = true }) {
  const sub = onBand ? "text-on-deck" : "text-muted";
  if (deal.phase === "hand") {
    const stallCount = new Set(deal.kept.map(({ stall }) => stall.id)).size;
    const unfinished = deal.index < deal.hand.length;
    return (
      <>
        <div className="mt-1.5"><BackLink label={unfinished ? "Keep dealing" : "Home"} onClick={unfinished ? deal.resume : onHome} onBand={onBand} /></div>
        {deal.kept.length > 0 && <Fan kept={deal.kept} />}
        <div className="text-center">
          <h1 className="font-serif text-[28px] leading-tight">Your hand</h1>
          <p className={`text-[13px] ${sub}`}>{deal.kept.length} kept from {deal.index} card{deal.index === 1 ? "" : "s"}{stallCount ? ` · ${stallCount} stall${stallCount === 1 ? "" : "s"}` : ""}</p>
        </div>
      </>
    );
  }
  if (deal.phase === "dealing" && deal.current) {
    return (
      <>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <BackLink label="Home" onClick={onHome} onBand={onBand} />
          <h1 className="font-serif text-2xl">Card {deal.index + 1} of {deal.hand.length}</h1>
        </div>
        <div role="progressbar" aria-label="Cards dealt" aria-valuemin={0} aria-valuemax={deal.hand.length} aria-valuenow={deal.index} className="mt-3.5 flex gap-1">
          {deal.hand.map((entry, i) => <span key={entry.item.id} className={`h-1 flex-1 rounded-full ${i <= deal.index ? (onBand ? "bg-white" : "bg-deck") : (onBand ? "bg-white/20" : "bg-line")}`} />)}
        </div>
        <p className={`mt-1.5 text-xs ${sub}`}>{filterSummary(deal.filters)} · {deal.kept.length} kept</p>
      </>
    );
  }
  return (
    <>
      <div className="mt-1.5"><BackLink label="Home" onClick={onHome} onBand={onBand} /></div>
      <h1 className="font-serif text-[30px] leading-[1.1]">Deal me a dish</h1>
      <p className={`mt-0.5 text-sm ${sub}`}>Ten dishes from the open stalls, one at a time. Keep what looks good.</p>
    </>
  );
}

// The way in, on the home page: a small card, never in the way of ordering.
export function DealEntry({ stalls, demoMode, onOpen }) {
  const teaser = stalls.filter((stall) => stallStatus(stall, demoMode).live).flatMap((stall) => {
    const item = stall.items.find((dish) => dish.available);
    return item ? [{ item, stall }] : [];
  }).slice(0, 3);
  return (
    <button type="button" onClick={onOpen} className="relative flex min-h-20 w-full items-center gap-3.5 overflow-hidden rounded-2xl bg-deck py-3 pr-3.5 pl-32 text-left text-white hover:bg-deck-hover">
      {teaser.map(({ item, stall }, i) => (
        <span key={item.id} aria-hidden="true" className="absolute top-2.5 flex h-[60px] w-11 items-center justify-center rounded-lg border border-line bg-white shadow-[0_6px_12px_-6px_rgba(20,60,38,.5)]" style={{ left: 14 + i * 24, transform: `rotate(${(i - 1) * 12}deg)` }}>
          <span className="flex size-7 items-center justify-center rounded-full font-serif text-[11px] text-mint-ink" style={{ background: stallTint(stall) }}>{initials(item.name)}</span>
        </span>
      ))}
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-lg leading-tight">Can&apos;t decide?</span>
        <span className="block text-[13px] text-on-deck">Deal me a dish · a quick game</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-on-deck"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}
