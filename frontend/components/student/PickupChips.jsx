"use client";

import { useEffect, useRef, useState } from "react";

// The student's preferred pickup time ("ASAP" or "HH:MM"), picked on the
// menu and used by Checkout to pre-select each stall's slot. Per tab, like
// the bag; storage can be unavailable, so every access is guarded.
const PICKUP_KEY = "mealdeck.pickup";
const ASAP = "ASAP";
const SLOT_MINUTES = 15;
// Same fallbacks as the backend's SlotService for stalls with no hours set.
const DEFAULT_OPEN = 8 * 60;
const DEFAULT_CLOSE = 22 * 60;

export function readPreferredPickup() {
  try {
    return sessionStorage.getItem(PICKUP_KEY) || ASAP;
  } catch {
    return ASAP;
  }
}

function savePreferredPickup(value) {
  try {
    sessionStorage.setItem(PICKUP_KEY, value);
  } catch {
    // Not saved; checkout just falls back to the first free slot.
  }
}

// "12:30" or "12:30:00" -> minutes since midnight.
function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toValue(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// "12:45", "1:00": compact 12-hour clock, no AM/PM (it's always today).
function toLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  return `${((hours + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")}`;
}

// Campus wall-clock time, whatever the device's time zone.
function campusMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

// Quarter-hour times still ahead today, from the earliest opening to the
// last slot that ends by the latest closing among stalls taking orders.
// Mirrors SlotService: a slot must start after now and end by closing.
function pickupTimes(stalls, now) {
  const taking = stalls.filter((stall) => !stall.closedToday && !stall.ordersPaused && !stall.listingOnly);
  if (taking.length === 0) return [];
  const open = Math.min(...taking.map((stall) => (stall.openTime ? toMinutes(stall.openTime) : DEFAULT_OPEN)));
  const close = Math.max(...taking.map((stall) => (stall.closeTime ? toMinutes(stall.closeTime) : DEFAULT_CLOSE)));
  const firstAfterNow = (Math.floor(now / SLOT_MINUTES) + 1) * SLOT_MINUTES;
  const firstAfterOpen = Math.ceil(open / SLOT_MINUTES) * SLOT_MINUTES;
  const times = [];
  for (let minute = Math.max(firstAfterNow, firstAfterOpen); minute + SLOT_MINUTES <= close; minute += SLOT_MINUTES) {
    times.push(minute);
  }
  return times;
}

// `variant`: "band" (one scrolling row on the green band) or "panel"
// (wrapping chips on the white desktop side panel).
export default function PickupChips({ stalls, variant = "band" }) {
  const panel = variant === "panel";
  const [value, setValue] = useState(ASAP);
  // Null until mounted: the server render can't know the student's "now".
  const [now, setNow] = useState(null);
  const groupRef = useRef(null);

  useEffect(() => {
    setValue(readPreferredPickup()); // eslint-disable-line react-hooks/set-state-in-effect
    setNow(campusMinutesNow());
    const timer = setInterval(() => setNow(campusMinutesNow()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const options = [{ value: ASAP, label: "ASAP" }, ...(now === null ? [] : pickupTimes(stalls, now).map((minute) => ({ value: toValue(minute), label: toLabel(minute) })))];
  // A stored time that has since passed reads as ASAP.
  const selected = options.some((option) => option.value === value) ? value : ASAP;

  function choose(next) {
    setValue(next);
    savePreferredPickup(next);
  }

  // Radio-group keys: arrows move and select, Home/End jump.
  function handleKeyDown(event) {
    const index = options.findIndex((option) => option.value === selected);
    const moves = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const nextIndex = (moves[event.key] + options.length) % options.length;
    choose(options[nextIndex].value);
    groupRef.current?.querySelectorAll('[role="radio"]')[nextIndex]?.focus();
  }

  return (
    <div className={panel ? "" : "mt-3 flex items-center gap-2.5"}>
      {!panel && <span className="shrink-0 text-xs font-semibold tracking-[.04em] text-on-deck uppercase" aria-hidden="true">Pickup</span>}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Preferred pickup time"
        onKeyDown={handleKeyDown}
        className={panel
          ? "-m-1 flex max-h-[184px] flex-wrap gap-1.5 overflow-y-auto p-1"
          : "-my-1 -mr-5 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1 pr-5 pl-1 [scrollbar-width:none] sm:-mr-8 sm:pr-8 lg:mr-0 lg:pr-0 lg:[mask-image:linear-gradient(to_right,black_92%,transparent)] [&::-webkit-scrollbar]:hidden"}
      >
        {options.map((option) => {
          const checked = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => choose(option.value)}
              className={panel
                ? `h-8 shrink-0 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${checked ? "border-deck bg-deck text-white" : "border-field bg-white text-ink hover:border-deck hover:bg-mint"}`
                : `h-11 shrink-0 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-white ${checked ? "border-white bg-white text-deck" : "border-white/25 text-white hover:bg-white/10"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
