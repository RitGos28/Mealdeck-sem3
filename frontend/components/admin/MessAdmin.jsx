"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

const button = "rounded-xl bg-[#173725] px-3 py-2 text-sm font-semibold text-white hover:bg-[#28543a] disabled:opacity-50";
const subtle = "rounded-xl border border-[#d8e2d5] px-3 py-2 text-sm font-semibold text-[#315c3d] hover:bg-[#f3f7f1]";
const field = "w-full rounded-xl border border-[#e0e8dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#477355] focus:ring-2 focus:ring-[#dbead6]";

function MealCard({ date, meal, onChange, onError }) {
  const [text, setText] = useState(meal.items.join(", "));
  const added = meal.items.length > 0;

  async function run(path, method = "POST", body) {
    try { await api(`/api/admin/mess/${date}/${meal.meal}${path}`, { method, body }); await onChange(); } catch (err) { onError(err.message); }
  }

  return <div className="rounded-2xl border border-[#e1e8dd] bg-white p-4 shadow-sm">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <h3 className="font-display text-lg font-bold">{meal.label}</h3>
      {meal.confirmed && <span className="rounded-full bg-[#dbead6] px-2.5 py-0.5 text-xs font-semibold text-[#315c3d]">Checked and locked</span>}
      {!meal.confirmed && meal.locked && <span className="rounded-full bg-[#fff3d6] px-2.5 py-0.5 text-xs font-semibold text-[#8a5a12]">Locked</span>}
      {added && <span className="text-xs text-gray-500">{meal.addedByStudent ? `added by student #${meal.addedByStudent}` : "set by an admin or after corrections"}</span>}
    </div>
    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Dishes, separated by commas" aria-label={`${meal.label} dishes`} className={field} />
    <div className="mt-3 flex flex-wrap gap-2">
      <button className={button} onClick={() => run("", "PUT", { items: text })} disabled={!text.trim()}>{added ? "Save dishes" : "Add menu"}</button>
      {added && !meal.confirmed && <button className={subtle} onClick={() => run("/confirm")}>Confirm as correct</button>}
      {added && meal.locked && <button className={subtle} onClick={() => run("/unlock")}>Unlock</button>}
      {added && <button className="rounded-xl border border-[#e8c9c2] px-3 py-2 text-sm font-semibold text-[#9a4a3f] hover:bg-[#fbe9e7]" onClick={() => { if (window.confirm(`Delete this ${meal.label.toLowerCase()} menu?`)) run("", "DELETE"); }}>Delete</button>}
    </div>
  </div>;
}

function Prices({ meals, onChange, onError }) {
  const [values, setValues] = useState(() => Object.fromEntries(meals.map((m) => [m.meal, m.priceInr ?? ""])));
  async function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(Object.entries(values).map(([meal, price]) => [meal, price === "" ? null : Number(price)]));
    try { await api("/api/admin/mess/prices", { method: "PUT", body }); await onChange(); } catch (err) { onError(err.message); }
  }
  return <form onSubmit={save} className="mb-7 rounded-2xl border border-[#dce6d8] bg-white p-4">
    <h3 className="mb-1 font-display text-lg font-bold">Day-scholar prices</h3>
    <p className="mb-3 text-sm text-gray-500">Rupees a plate. Leave blank to show &ldquo;Price at the counter&rdquo;.</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {meals.map((m) => <label key={m.meal} className="grid gap-1 text-xs font-semibold text-gray-500">{m.label}
        <input inputMode="numeric" pattern="[0-9]*" value={values[m.meal]} onChange={(e) => setValues({ ...values, [m.meal]: e.target.value.replace(/\D/g, "") })} className={field} />
      </label>)}
    </div>
    <button className={`${button} mt-3`}>Save prices</button>
  </form>;
}

// Admin side of Mess today: set or fix a day's menus, confirm one as correct
// (which locks it against student flags), and the plate prices.
export default function MessAdmin() {
  const [data, setData] = useState(null);
  const [date, setDate] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(async (day) => {
    try {
      const result = await api(`/api/admin/mess${day ? `?date=${day}` : ""}`);
      setData(result); setDate(result.date); setError(null);
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(""); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return <section>
    <div className="mb-5"><h2 className="font-display text-2xl font-bold">Mess today</h2><p className="mt-1 text-sm text-gray-500">The campus mess menu students write. Confirming a menu as correct locks it, so students can&apos;t flag it. Use this to seed a day yourself.</p></div>
    {error && <p className="mb-4 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
    {!data ? <p className="text-sm text-gray-500">Loading…</p> : <>
      <Prices key={data.meals.map((m) => m.priceInr).join("-")} meals={data.meals} onChange={() => load(date)} onError={setError} />
      <div className="mb-4 flex items-center gap-2"><label htmlFor="mess-date" className="text-sm font-semibold text-gray-500">Day</label>
        <input id="mess-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); if (e.target.value) load(e.target.value); }} className="rounded-xl border border-[#e0e8dc] bg-white px-3 py-2 text-sm" /></div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.meals.map((meal) => <MealCard key={`${data.date}-${meal.meal}-${meal.items.join("|")}-${meal.locked}`} date={data.date} meal={meal} onChange={() => load(data.date)} onError={setError} />)}
      </div>
    </>}
  </section>;
}
