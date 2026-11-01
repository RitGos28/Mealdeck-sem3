"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

// The admin Overview: the numbers to pitch with, from real orders only
// (GET /api/admin/pitch leaves out test accounts). Nothing here is
// estimated: a number that can't be known yet shows "–".

const rupees = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
const pct = (value) => (value === null || value === undefined ? "–" : `${value}%`);
const day = (iso, options) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", options);
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

function headline(p) {
  if (p.orders === 0) return null;
  const stalls = p.stalls.filter((s) => s.orders > 0).length;
  let text = `${plural(p.customers, "student")} placed ${plural(p.orders, "pre-order")} at ${plural(stalls, "stall")} since ${day(p.firstOrderDate, { day: "numeric", month: "short" })}`;
  if (p.repeatRate !== null && p.repeatCustomers > 0) text += `; ${p.repeatRate}% came back on another day`;
  return `${text}.`;
}

function Tile({ value, label, note }) {
  return (
    <div className="rounded-2xl border border-[#e1e8dd] bg-white p-4">
      <p className="font-display text-3xl font-bold tabular-nums text-[#173725]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-700">{label}</p>
      {note && <p className="mt-0.5 text-xs text-gray-500">{note}</p>}
    </div>
  );
}

// Orders per day, last 14 days: one series, so one colour and no legend.
function DailyBars({ days }) {
  const max = Math.max(1, ...days.map((d) => d.orders));
  return (
    <figure className="rounded-2xl border border-[#e1e8dd] bg-white p-4">
      <figcaption className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-gray-700">Pre-orders per day, last 14 days</span>
        <span className="text-xs text-gray-500">most in a day: {max}</span>
      </figcaption>
      <div className="flex h-32 items-end gap-[2px] border-b border-[#e1e8dd]" role="img" aria-label={days.map((d) => `${day(d.date, { day: "numeric", month: "short" })}: ${d.orders}`).join(", ")}>
        {days.map((d) => (
          <div key={d.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            <div className="w-full rounded-t-[4px] bg-[#2f6b45] group-hover:bg-[#173725] group-focus:bg-[#173725]" style={{ height: d.orders ? `${(d.orders / max) * 100}%` : "2px", opacity: d.orders ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#173725] px-2 py-1 text-xs text-white group-hover:block group-focus:block">
              {day(d.date, { weekday: "short", day: "numeric", month: "short" })} · {plural(d.orders, "order")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-500">
        <span>{day(days[0].date, { day: "numeric", month: "short" })}</span>
        <span>today</span>
      </div>
    </figure>
  );
}

export default function PitchView() {
  const [pitch, setPitch] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api("/api/admin/pitch").then(setPitch, (err) => setError(err.message));
  }, []);

  if (error) return <p className="rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>;
  if (!pitch) return <p className="py-10 text-center text-gray-500" role="status">Counting…</p>;

  const line = headline(pitch);
  const reach = pitch.students ? Math.round((100 * pitch.customers) / pitch.students) : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the sentence is on screen to select by hand.
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-[#173725] p-5 text-white sm:p-6">
        <p className="text-xs font-bold tracking-[.18em] text-[#bfe0c4] uppercase">The pitch, in one line</p>
        {line ? (
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-3xl font-display text-2xl leading-snug font-bold sm:text-3xl">{line}</p>
            <button type="button" onClick={copy} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">{copied ? "Copied" : "Copy"}</button>
          </div>
        ) : (
          <p className="mt-2 font-display text-2xl font-bold">No real pre-orders yet. The numbers fill in from the first one.</p>
        )}
        <p className="mt-3 text-xs text-[#bfe0c4]">From orders on record only, nothing estimated. Test accounts left out: {pitch.testAccounts.join(", ")}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile value={pitch.students} label="Students signed up" note={`${pitch.studentsJoinedThisWeek} in the last 7 days`} />
        <Tile value={pitch.customers} label="Have pre-ordered" note={reach === null ? null : `${reach}% of sign-ups`} />
        <Tile value={pct(pitch.repeatRate)} label="Came back another day" note={`${plural(pitch.repeatCustomers, "student")}`} />
        <Tile value={pitch.orders} label="Pre-orders" note={`${pitch.ordersThisWeek} in the last 7 days`} />
        <Tile value={pct(pitch.collectedRate)} label="Picked up" note="of orders that were ready" />
        <Tile value={pct(pitch.onTimeRate)} label="Ready on time" note="marked ready by the pickup time" />
        <Tile value={rupees(pitch.orderValue)} label="Order value" note="paid at the counter, to the stalls" />
        <Tile value={`${pitch.stallsTakingOrders} of ${pitch.stallsListed}`} label="Stalls taking pre-orders" note={`${pitch.dishesListed} dishes listed`} />
      </div>

      <DailyBars days={pitch.lastTwoWeeks} />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="overflow-x-auto rounded-2xl border border-[#e1e8dd] bg-white p-4">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-sm font-semibold text-gray-700">By stall</caption>
            <thead><tr className="text-left text-xs text-gray-500"><th className="py-1 font-semibold">Stall</th><th className="font-semibold">Pre-orders</th><th className="font-semibold">Students</th><th className="font-semibold">Value</th><th className="font-semibold">On time</th></tr></thead>
            <tbody>
              {pitch.stalls.map((s) => (
                <tr key={s.name} className="border-t border-[#edf1ea]">
                  <td className="py-2 pr-2">{s.name}{!s.takingOrders && <span className="ml-2 rounded-full bg-[#F0F2EF] px-2 py-0.5 text-[11px] font-semibold text-gray-600">Menu only</span>}</td>
                  <td className="tabular-nums">{s.orders}</td>
                  <td className="tabular-nums">{s.customers}</td>
                  <td className="tabular-nums">{rupees(s.orderValue)}</td>
                  <td className="tabular-nums">{pct(s.onTimeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-[#e1e8dd] bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Most ordered dishes</p>
          {pitch.topDishes.length === 0 ? <p className="text-sm text-gray-500">None yet.</p> : (
            <ol className="space-y-2 text-sm">
              {pitch.topDishes.map((d, i) => (
                <li key={`${d.stall}|${d.name}`} className="flex justify-between gap-3"><span><span className="mr-2 text-gray-400 tabular-nums">{i + 1}</span>{d.name} <span className="text-gray-500">· {d.stall}</span></span><span className="tabular-nums font-semibold">×{d.quantity}</span></li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
