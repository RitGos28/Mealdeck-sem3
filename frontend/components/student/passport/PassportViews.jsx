"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { stallTint } from "../browse";
import { buildPassport, newStampsFrom, stallInk } from "./passport";

function letters(name) {
  return name.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

function day(isoDate, options = { weekday: "short" }) {
  return isoDate ? new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", options) : "";
}

// An ink stamp. Tried: a rotated double ring in the stall's ink. Not yet:
// a dashed outline.
export function Stamp({ name, tried = false, ink = "#1F6B43", size = 64, rotate = -8, note = "" }) {
  const style = { width: size, height: size };
  if (!tried) {
    return <span aria-hidden="true" style={style} className="flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#CBD3CC] font-serif text-[#A7B2AB]"><span style={{ fontSize: Math.round(size * 0.32) }}>{letters(name)}</span></span>;
  }
  return (
    <span aria-hidden="true" style={{ ...style, borderColor: ink, color: ink, transform: `rotate(${rotate}deg)` }} className="flex shrink-0 rounded-full border-[2.5px] p-[3px]">
      <span style={{ borderColor: ink, background: `${ink}14` }} className="flex size-full flex-col items-center justify-center rounded-full border">
        <span className="font-serif leading-none" style={{ fontSize: Math.round(size * 0.3) }}>{letters(name)}</span>
        {note && <span className="mt-0.5 font-bold tracking-[.06em]" style={{ fontSize: Math.max(9, Math.round(size * 0.14)) }}>{note}</span>}
      </span>
    </span>
  );
}

function Bar({ value, color = "#163D29", track = "#E6EAE5", height = 6 }) {
  return (
    <span aria-hidden="true" className="block overflow-hidden rounded-full" style={{ height, background: track }}>
      <span className="block h-full rounded-full" style={{ width: value > 0 ? `${Math.max(3, Math.round(value * 100))}%` : 0, background: color }} />
    </span>
  );
}

// The student's passport, from their orders and today's menus. null while
// loading; { error } if either request fails.
export function usePassport() {
  const [passport, setPassport] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([api("/api/orders"), api("/api/stalls")]).then(
      ([orders, stalls]) => active && setPassport(buildPassport(orders ?? [], stalls ?? [])),
      () => active && setPassport({ error: true }),
    );
    return () => { active = false; };
  }, []);
  return passport;
}

const ROTATIONS = [-9, 6, -4, 10, -12];

// The Account page's way in: progress, the latest stamps and one dish to try.
export function PassportCard() {
  const passport = usePassport();
  if (!passport || passport.error) return null;
  const next = passport.suggestions.picks[0];
  return (
    <Link href="/account/passport" className="mb-6 block rounded-[18px] bg-mint p-4 text-ink hover:brightness-[.98]">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-[.05em] text-mint-ink uppercase">Food passport</span>
        <span className="text-[13px] font-semibold text-mint-ink">Open ›</span>
      </span>
      <span className="mt-1 block font-serif text-2xl">{passport.triedCount} of {passport.total} dishes tried</span>
      <span className="mt-2 block"><Bar value={passport.triedCount / Math.max(1, passport.total)} track="#FFFFFF" height={8} /></span>
      {passport.stamps.length > 0 ? (
        <span className="mt-3 flex gap-2.5">
          {passport.stamps.slice(0, 3).map((stamp, i) => (
            <span key={stamp.item.id} className="flex flex-col items-center gap-1">
              <Stamp name={stamp.item.name} tried ink={stallInk(stamp.stall)} size={58} rotate={ROTATIONS[i]} />
              <span className="text-[11px] font-semibold text-mint-ink">{day(stamp.first)}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className="mt-3 block text-[13px] text-mint-ink">Pick up your first order to get your first stamp.</span>
      )}
      {next && <span className="mt-3 block text-[13px] text-[#3E5A48]">Next to try: <strong className="font-semibold">{next.item.name}</strong> at {next.stall.name} · ₹{next.item.price}</span>}
    </Link>
  );
}

function SuggestionCard({ pick }) {
  return (
    <Link href={`/?stall=${pick.stall.id}`} className="relative w-[170px] shrink-0 rounded-2xl border border-line p-2.5 hover:border-field">
      <span className="flex h-[70px] items-center justify-center rounded-xl" style={{ background: stallTint(pick.stall) }}>
        <span className="flex size-[46px] items-center justify-center rounded-full bg-white font-serif text-mint-ink">{letters(pick.item.name)}</span>
      </span>
      <span className="absolute top-4 left-4 rounded-full bg-white px-1.5 py-px text-[11px] font-bold text-mint-ink">NEW</span>
      <span className="mt-2 line-clamp-2 h-[34px] text-sm leading-tight font-semibold">{pick.item.name}</span>
      <span className="mt-0.5 block truncate text-xs text-muted">₹{pick.item.price} · {pick.stall.name}</span>
      <span className="mt-1 block truncate text-xs text-mint-ink">{pick.why}</span>
    </Link>
  );
}

// /account/passport: progress across campus, dishes to try, and every
// stall's page of stamps.
export function PassportHome({ passport }) {
  const { picks, usual } = passport.suggestions;
  return (
    <>
      {picks.length > 0 && (
        <section className="mb-6">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[22px]">Try something new</h2>
            {usual && <span className="text-[13px] text-muted">around your usual ₹{usual.item.price}</span>}
          </div>
          <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8">
            {picks.map((pick) => <SuggestionCard key={pick.item.id} pick={pick} />)}
          </div>
        </section>
      )}
      <section>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-[22px]">Stalls</h2>
          <span className="text-[13px] text-muted">your stamps</span>
        </div>
        <ul>
          {passport.perStall.map(({ stall, tried, total }) => (
            <li key={stall.id}>
              <Link href={`/account/passport?stall=${stall.id}`} className="flex min-h-16 items-center gap-3 border-b border-[#EEF1ED] py-2 hover:bg-[#F6F8F5]">
                <Stamp name={stall.name} tried={tried > 0} ink={stallInk(stall)} size={46} rotate={-10} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg">{stall.name}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="flex-1"><Bar value={tried / Math.max(1, total)} color={stallInk(stall)} /></span>
                    <span className="w-16 text-right text-xs whitespace-nowrap text-muted">{tried} / {total}</span>
                  </span>
                </span>
                <span className="text-muted" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// /account/passport?stall=6: one stamp per menu section.
export function StallStamps({ entry }) {
  const ink = stallInk(entry.stall);
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-4 lg:grid-cols-6">
      {entry.sections.map((section, i) => (
        <li key={section.name}>
          <Link href={`/?stall=${entry.stall.id}`} aria-label={`${section.name}, ${section.tried} of ${section.total} tried`} className="flex flex-col items-center gap-1.5 rounded-xl px-0.5 py-2 text-center hover:bg-[#F6F8F5]">
            <Stamp name={section.name} tried={section.tried > 0} ink={ink} size={60} rotate={ROTATIONS[i % ROTATIONS.length]} note={section.times ? `${section.times}×` : ""} />
            <span className="line-clamp-2 h-[29px] text-xs leading-tight font-semibold">{section.name}</span>
            <span className="text-[11px]" style={{ color: section.tried ? ink : undefined }}>{section.tried ? `${section.tried} tried · ${section.total - section.tried} to try` : <span className="text-muted">{section.total} to try</span>}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Shown on My orders when a vendor marks an order "Picked up" and it had a
// dish the student had never picked up before.
export function NewStampCard({ stall, items, passport, onClose }) {
  const first = items[0];
  const next = passport.suggestions.picks[0];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="new-stamp-title" className="fixed inset-0 z-40 flex items-end justify-center bg-[#0B1F14]/60 p-4 sm:items-center">
      <div className="new-stamp w-full max-w-sm overflow-hidden rounded-3xl bg-white text-ink shadow-2xl">
        <div className="flex flex-col items-center bg-deck px-5 pt-5 pb-6 text-center text-white">
          <p className="text-xs font-semibold tracking-[.05em] text-on-deck uppercase">Picked up · {stall.name}</p>
          <div className="my-5 flex size-40 -rotate-12 rounded-full border-4 border-[#F3D9A6] p-1.5 text-[#F3D9A6]">
            <div className="flex size-full flex-col items-center justify-center gap-1 rounded-full border-[1.5px] border-dashed border-[#F3D9A6]">
              <span className="max-w-[80%] truncate text-[11px] font-semibold tracking-[.14em] uppercase">{stall.name}</span>
              <span className="font-serif text-[44px] leading-none">{letters(first.menuItemName)}</span>
              <span className="text-[11px] font-semibold tracking-[.14em] uppercase">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <h2 id="new-stamp-title" className="font-serif text-[32px] leading-tight">{items.length > 1 ? `${items.length} new stamps!` : "New stamp!"}</h2>
          <p className="mt-1.5 text-[15px] text-[#D6EBDC]">{first.menuItemName}{items.length > 1 ? ` and ${items.length - 1} more` : ""} · {passport.triedCount} of {passport.total} campus dishes tried</p>
        </div>
        <div className="p-5">
          {next && (
            <>
              <p className="mb-2 text-xs font-semibold tracking-[.05em] text-muted uppercase">Next on your passport</p>
              <Link href={`/?stall=${next.stall.id}`} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: stallTint(next.stall) }}>
                <Stamp name={next.item.name} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{next.item.name}</span>
                  <span className="block truncate text-[13px] text-muted">₹{next.item.price} · {next.stall.name}</span>
                </span>
              </Link>
            </>
          )}
          <div className="mt-4 flex gap-2.5">
            <Link href="/account/passport" className="flex h-12 flex-1 items-center justify-center rounded-full bg-deck font-semibold text-white hover:bg-deck-hover">Open my passport</Link>
            <button type="button" onClick={onClose} className="h-12 rounded-full border border-field px-5 font-semibold hover:border-deck">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Watches one live order. When the vendor marks it "Picked up" while the
// student is looking at it, and it had a dish never picked up before, the
// "New stamp!" card appears; once per order, remembered on the device.
export function NewStampWatcher({ order, wasLive }) {
  const [shown, setShown] = useState(null);
  const pickedUp = wasLive && order.status === "COMPLETED";

  useEffect(() => {
    if (!pickedUp) return undefined;
    const key = `mealdeck.stamped.${order.code}`;
    try {
      if (localStorage.getItem(key)) return undefined;
    } catch {
      // No storage: it may show again on a later visit, which is fine.
    }
    let active = true;
    Promise.all([api("/api/orders"), api("/api/stalls")]).then(([orders, stalls]) => {
      if (!active) return;
      const passport = buildPassport(orders ?? [], stalls ?? []);
      const items = newStampsFrom(order, passport);
      const stall = (stalls ?? []).find((candidate) => candidate.id === order.stallId);
      try {
        localStorage.setItem(key, "1");
      } catch {
        // See above.
      }
      if (items.length > 0 && stall) setShown({ stall, items, passport });
    }, () => {});
    return () => { active = false; };
  }, [pickedUp, order]);

  if (!shown) return null;
  return <NewStampCard {...shown} onClose={() => setShown(null)} />;
}
