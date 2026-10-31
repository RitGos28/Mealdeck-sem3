"use client";

import { useEffect, useRef } from "react";
import { useQueueLength } from "../menu/MenuSection";
import { initials } from "./OrderAgain";
import { CRAVINGS, cravingDishes, cravingSummary, stallStatus, stallTint, topCategories } from "./browse";

export function Chevron({ direction = "right", size = 18 }) {
  const path = { right: "M9 6l6 6-6 6", left: "M15 6l-6 6 6 6" }[direction];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d={path} /></svg>;
}

function StallTile({ stall, size = "size-12 text-base" }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-[14px] font-serif text-mint-ink ${size}`} style={{ background: stallTint(stall) }} aria-hidden="true">{initials(stall.name)}</span>;
}

function StatusDot({ status }) {
  return (
    <span className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${status.live ? "text-deck" : status.paused ? "text-danger" : "text-muted"}`}>
      <span className={`size-1.5 rounded-full ${status.live ? "bg-veg" : status.paused ? "bg-danger" : "bg-field"}`} aria-hidden="true" />{status.label}
    </span>
  );
}

// "By stall · By craving", at the top of the home sheet.
export function ViewSwitch({ view, onChange }) {
  const option = (id, label) => (
    <button type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`h-10 flex-1 rounded-full text-sm transition-colors ${view === id ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "font-medium text-muted hover:text-ink"}`}>{label}</button>
  );
  return (
    <div role="group" aria-label="Browse by" className="flex rounded-full bg-[#F0F3EF] p-[3px] lg:max-w-sm">
      {option("stall", "By stall")}
      {option("craving", "By craving")}
    </div>
  );
}

export function SectionTitle({ children, aside }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="font-serif text-[22px] leading-tight">{children}</h2>
      {aside && <span className="text-[13px] text-muted">{aside}</span>}
    </div>
  );
}

function StallRow({ stall, demoMode, onOpen }) {
  const status = stallStatus(stall, demoMode);
  const queueLength = useQueueLength(stall, demoMode);
  const queue = !status.live ? null : queueLength === null ? null : queueLength === 0 ? "No queue" : `${queueLength} in queue`;
  const tags = topCategories(stall);
  return (
    <li>
      <a href={`/?stall=${stall.id}`} onClick={(event) => { event.preventDefault(); onOpen(stall.id); }} className="flex items-center gap-3.5 rounded-2xl border border-line p-3 transition-colors hover:border-field hover:bg-[#F6F8F5]">
        <StallTile stall={stall} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-serif text-lg leading-tight">{stall.name}</span>
            <StatusDot status={status} />
          </span>
          <span className="mt-0.5 block text-[13px] text-muted">{stall.items.length} dishes{queue && ` · ${queue}`}</span>
          {tags.length > 0 && <span className="mt-0.5 block truncate text-xs text-[#8A968F]">{tags.join(" · ")}</span>}
        </span>
      </a>
    </li>
  );
}

export function StallList({ stalls, demoMode, onOpen }) {
  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
      {stalls.map((stall) => <StallRow key={stall.id} stall={stall} demoMode={demoMode} onOpen={onOpen} />)}
    </ul>
  );
}

export function CravingGrid({ stalls, demoMode, onOpen }) {
  const cravings = CRAVINGS.map((craving) => ({ craving, summary: cravingSummary(cravingDishes(craving, stalls, demoMode)) })).filter((entry) => entry.summary);
  if (cravings.length === 0) return <p className="py-8 text-center text-muted">Nothing to order right now.</p>;
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
        {cravings.map(({ craving, summary }) => (
          <li key={craving.id}>
            <a href={`/?craving=${craving.id}`} onClick={(event) => { event.preventDefault(); onOpen(craving.id); }} className="flex h-[76px] flex-col justify-end rounded-2xl px-3 py-2.5 transition-[filter] hover:brightness-[.97]" style={{ background: craving.tint }}>
              <span className="font-serif text-lg leading-tight text-ink">{craving.name}</span>
              <span className="text-xs text-muted">{summary}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-muted">Tap one to see it from every stall, cheapest first.</p>
    </>
  );
}

// Pinned row of every stall on a stall page, to hop between them without
// going back. The current one is scrolled into view.
export function StallTabs({ stalls, activeId, onOpen }) {
  const rowRef = useRef(null);
  useEffect(() => {
    const active = rowRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);
  return (
    <nav aria-label="Stalls" className="sticky top-0 z-10 -mx-5 -mt-6 mb-3 rounded-t-3xl border-b border-line bg-white px-5 pt-4 pb-3 sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:p-0 lg:pb-1">
      <ul ref={rowRef} className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] lg:flex-wrap">
        {stalls.map((stall) => {
          const active = String(stall.id) === String(activeId);
          return (
            <li key={stall.id} className="shrink-0">
              <a href={`/?stall=${stall.id}`} aria-current={active ? "page" : undefined} onClick={(event) => { event.preventDefault(); onOpen(stall.id); }} className={`flex h-9 items-center rounded-full px-3.5 text-[13px] whitespace-nowrap transition-colors ${active ? "bg-deck font-semibold text-white" : "border border-field font-medium text-ink hover:border-deck"}`}>
                {stall.name}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BackLink({ label, onClick, onBand = true }) {
  return (
    <button type="button" onClick={onClick} className={`-ml-1 flex min-h-10 items-center gap-1 rounded-lg px-1 text-sm ${onBand ? "text-[#D6EBDC] hover:text-white focus-visible:outline-white" : "text-muted hover:text-ink"}`}>
      <Chevron direction="left" />{label}
    </button>
  );
}

// The line under a stall's name: status, dishes and queue.
export function useStallSubtitle(stall, demoMode) {
  const queueLength = useQueueLength(stall ?? { id: 0, closedToday: true }, demoMode);
  if (!stall) return "";
  const status = stallStatus(stall, demoMode);
  const queue = status.live && queueLength !== null ? (queueLength === 0 ? " · No queue" : ` · ${queueLength} in queue`) : "";
  return `${status.label} · ${stall.items.length} dishes${queue}`;
}
