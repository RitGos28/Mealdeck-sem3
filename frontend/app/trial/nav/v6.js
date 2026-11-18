// Variety 6: the home follows the clock. The same app at 8 am, 1 pm, 9:40 pm
// and 11 pm leads with whatever makes sense right then (mess breakfast and
// chai before class, shortest wait at lunch, last orders, night stalls), and
// a stall page opens on "good right now" before the full menu index.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, sectionTitle, tile, dishRow, vegMark,
  STALLS, statusDot, bagPill, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Menus that follow the clock";
export const IDEA = "The home changes with the time of day, so at 8 am you see breakfast before class, at 1 pm the shortest lunch wait, and at night the hostel night stalls.";

const cat = (stall, name) => MENUS[stall].categories.find((c) => c.name === name);
const item = (stall, catName, i) => cat(stall, catName).items[i];
const S = Object.fromEntries(STALLS.map((s) => [s.name, s]));
const TABS = [["menu", "Now"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]];

/** Top row: logo + the current time as a pill. */
const topRow = (time, label) => `
  <div style="display: flex; align-items: center; justify-content: space-between">
    ${logo}
    <span style="display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.12); font-size: 13px; font-weight: 600; color: #FFFFFF"><span style="width: 7px; height: 7px; border-radius: 999px; background: #9FE0B4"></span>${time} · ${label}</span>
  </div>`;

/** Meal-period switcher: the app picks the current one; tap another to peek ahead. */
const periods = (active, dark = false) => `
  <div role="tablist" aria-label="Time of day" style="display: flex; gap: 2px; margin-top: 14px; padding: 3px; border-radius: 999px; background: ${dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.12)"}">
    ${["Breakfast", "Lunch", "Snacks", "Dinner", "Night"].map((p) => {
      const on = p === active;
      return `<button type="button" role="tab" aria-selected="${on}" style="flex: 1; min-width: 0; height: 44px; padding: 0; border: 0; border-radius: 999px; background: ${on ? "#FFFFFF" : "transparent"}; color: ${on ? GREEN : "#D6EBDC"}; font-size: 12.5px; font-weight: 600">${p}</button>`;
    }).join("")}
  </div>`;

const eyebrow = (text, color = MUTED) => `<div style="font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: ${color}">${text}</div>`;

/** Small add-able dish pill used inside stall cards. */
const pick = (it) => `
  <button type="button" aria-label="Add ${it.name}, ₹${it.price}" style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 6px 0 12px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; font-size: 13px; font-weight: 500; white-space: nowrap">
    ${vegMark(it.veg)}${it.name}<span style="color: ${MUTED}">₹${it.price}</span><span aria-hidden="true" style="width: 30px; height: 30px; border-radius: 999px; background: ${MINT}; color: ${MINT_INK}; display: inline-flex; align-items: center; justify-content: center; font-size: 17px">+</span>
  </button>`;

/** A stall card that carries 2–3 dishes picked for this hour. */
const stallNow = (s, note, picks) => `
  <div style="padding: 12px; border-radius: 18px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <a href="#" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; min-height: 44px">
      ${tile(s.name, 44, s.tint, "13px")}
      <div style="flex: 1; min-width: 0">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><span style="font-family: ${SERIF}; font-size: 18px">${s.name}</span>${statusDot(s)}</div>
        <div style="margin-top: 1px; font-size: 13px; color: ${MUTED}">${note}</div>
      </div>
      <span style="color: ${MUTED}">${chevron()}</span>
    </a>
    <div style="display: flex; gap: 6px; margin-top: 10px; overflow: hidden">${picks.map(pick).join("")}</div>
  </div>`;

/** A closed stall, shown as one quiet line. */
const quietStall = (s, when) => `
  <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 48px; border-bottom: 1px solid #EEF1ED; text-decoration: none; color: ${MUTED}">
    ${tile(s.name, 32, "#F1F2F0")}<span style="flex: 1; font-size: 14px; font-weight: 500; color: ${INK}">${s.name}</span><span style="font-size: 13px">${when}</span>
  </a>`;

// ---------- 1 · 8:10 am ----------
const morning = frame(`
  ${band(`${topRow("8:10 am", "Breakfast")}${bigTitle("Morning, Aanya", "Class at 9:00 · you have 50 minutes")}${periods("Breakfast")}`)}
  ${sheet(`
    <a href="#" style="display: block; padding: 14px 16px; border-radius: 18px; background: ${MINT}; text-decoration: none; color: inherit; margin-bottom: 16px">
      <div style="display: flex; justify-content: space-between; align-items: baseline">${eyebrow("Mess · serving now", MINT_INK)}<span style="font-size: 12px; color: #3E5A48">till 9:30</span></div>
      <div style="margin-top: 4px; font-family: ${SERIF}; font-size: 21px">Poha, boiled egg, bread butter, tea</div>
      <div style="margin-top: 4px; font-size: 12px; color: #3E5A48">Added by a student at 7:52 · free for hostellers</div>
    </a>
    ${sectionTitle("Ready before your 9:00", "1 stall open")}
    ${stallNow(S["SnapEats"], "Ready in ~6 min · 1 in queue", [item("SnapEats", "Chai Nagri", 2), item("SnapEats", "Sandwiches", 0), item("SnapEats", "Hot Beverages", 0)])}
    <div style="margin-top: 16px">${eyebrow("Opening later")}</div>
    ${quietStall(S["Paid Mess"], "Opens 10 am")}
    ${quietStall(S["House of Chow"], "Opens 11 am")}
    ${quietStall(S["Quench"], "Paused")}
  `)}`, { tabItems: TABS });

// ---------- 2 · 1:10 pm ----------
const waits = [
  { s: S["House of Chow"], ready: "1:18", min: 8, q: "No queue" },
  { s: S["SnapEats"], ready: "1:24", min: 14, q: "4 in queue" },
  { s: S["Paid Mess"], ready: "1:38", min: 28, q: "9 in queue" },
];
const waitBar = ({ s, ready, min, q }, i) => `
  <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 56px; text-decoration: none; color: inherit; border-bottom: 1px solid #EEF1ED">
    ${tile(s.name, 38, s.tint, "12px")}
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 15px; font-weight: 600">${s.name}</span><span style="font-size: 14px; font-weight: 600; color: ${i === 0 ? "#1F6B43" : INK}">Ready ${ready}</span></div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px">
        <div style="flex: 1; height: 6px; border-radius: 999px; background: #EEF1ED; overflow: hidden"><div style="width: ${Math.round((min / 30) * 100)}%; height: 100%; border-radius: 999px; background: ${i === 0 ? "#2F8A57" : i === 1 ? "#C9A24A" : "#C0703A"}"></div></div>
        <span style="font-size: 12px; color: ${MUTED}; width: 120px; text-align: right; white-space: nowrap">${min} min · ${q}</span>
      </div>
    </div>
  </a>`;

const lunch = frame(`
  ${band(`${topRow("1:10 pm", "Lunch rush")}${bigTitle("Lunch rush", "Everyone's out of class. Here's the shortest wait.")}${periods("Lunch")}`)}
  ${sheet(`
    ${sectionTitle("Fastest right now", "updates live")}
    ${waits.map(waitBar).join("")}
    <div style="margin: 14px 0 6px">${eyebrow("Quick at House of Chow")}</div>
    <div style="display: flex; gap: 6px; margin: 0 -20px 14px; padding: 0 20px; overflow: hidden">${[item("House of Chow", "Pick A Meal", 0), item("House of Chow", "Noodles", 4), item("House of Chow", "Momos (8 Pcs)", 0)].map(pick).join("")}</div>
    <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: ${MINT}; text-decoration: none; color: inherit">
      <div style="flex: 1; min-width: 0">
        ${eyebrow("Mess lunch · till 2:30", MINT_INK)}
        <div style="margin-top: 3px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Rajma, jeera rice, aloo gobi, roti, salad</div>
        <div style="margin-top: 2px; font-size: 12px; color: #3E5A48">₹70 for day scholars · free for hostellers</div>
      </div><span style="color: ${MINT_INK}">${chevron()}</span>
    </a>
    <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 56px; margin-top: 10px; padding: 0 14px; border-radius: 16px; border: 1px solid ${LINE}; text-decoration: none; color: inherit">
      <span aria-hidden="true" style="font-size: 18px; color: ${GREEN}">↻</span>
      <div style="flex: 1; min-width: 0"><div style="font-size: 14px; font-weight: 600">Order again: your Tuesday lunch</div><div style="font-size: 13px; color: ${MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Veg Hakka Noodles (Half) + Veg Steam Momos · ₹180</div></div>
      <span style="color: ${MUTED}">${chevron()}</span>
    </a>
    <p style="margin: 12px 0 0; font-size: 13px; color: ${MUTED}">Quench is paused · back after 2 pm</p>
  `)}`, { tabItems: TABS });

// ---------- 3 · stall page at lunch ----------
const snap = MENUS["SnapEats"];
const LUNCH_CATS = ["Classic Indian Combos", "Veg Kathi Rolls", "Non Veg Kathi Rolls", "Continental"];
const rest = snap.categories.filter((c) => !LUNCH_CATS.includes(c.name));
const indexCell = (c) => `
  <a href="#" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; min-height: 48px; padding: 0 12px; border-radius: 12px; background: #F5F7F4; text-decoration: none; color: ${INK}; font-size: 13px; font-weight: 500">
    <span style="min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${c.name}</span><span style="flex-shrink: 0; font-size: 12px; color: ${MUTED}">${c.count}</span>
  </a>`;
const combos = cat("SnapEats", "Classic Indian Combos");
const stallPage = frame(`
  ${band(`${backLink("Lunch rush")}${bigTitle("SnapEats", "Ready ~1:24 · 4 in queue · open till 10 pm")}`)}
  ${sheet(`
    <div style="display: flex; align-items: baseline; justify-content: space-between">${eyebrow("Good for lunch", GREEN)}<span style="font-size: 12px; color: ${MUTED}">what students order 12–2</span></div>
    <div style="margin-top: 4px">
      ${dishRow(combos.items[4], { sub: "Combos" })}
      ${dishRow(combos.items[0], { sub: "Combos", qty: 1 })}
      ${dishRow(cat("SnapEats", "Veg Kathi Rolls").items[1], { sub: "Veg Kathi Rolls" })}
      ${dishRow(cat("SnapEats", "Non Veg Kathi Rolls").items[1], { sub: "Non Veg Kathi Rolls" })}
    </div>
    <div style="display: flex; align-items: baseline; justify-content: space-between; margin: 16px 0 8px">${eyebrow("Whole menu")}<span style="font-size: 12px; color: ${MUTED}">${snap.count} dishes · ${snap.categories.length} sections</span></div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px">${rest.slice(0, 8).map(indexCell).join("")}</div>
    <a href="#" style="display: flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 4px; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">+ ${rest.length - 8} more sections</a>
  `, "padding-bottom: 0")}
  ${bagPill(1, combos.items[0].price)}`, { tabItems: TABS });

// ---------- 4 · 9:40 pm ----------
const ring = (left, total, color) => {
  const r = 18, c = 2 * Math.PI * r, frac = left / total;
  return `<svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="${left} minutes left" style="flex-shrink: 0"><circle cx="24" cy="24" r="${r}" fill="none" stroke="#EEF1ED" stroke-width="5"/><circle cx="24" cy="24" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/><text x="24" y="28" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="${INK}">${left}m</text></svg>`;
};
const lastCall = (s, left, total, color, line, picks) => `
  <div style="padding: 12px; border-radius: 18px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <a href="#" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit">
      ${ring(left, total, color)}
      <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 18px">${s.name}</div><div style="margin-top: 1px; font-size: 13px; color: ${MUTED}">${line}</div></div>
      <span style="color: ${MUTED}">${chevron()}</span>
    </a>
    <div style="display: flex; gap: 6px; margin-top: 10px; overflow: hidden">${picks.map(pick).join("")}</div>
  </div>`;
const closing = frame(`
  ${band(`${topRow("9:40 pm", "Closing soon")}${bigTitle("Last orders", "Two stalls are wrapping up. Night stalls run till midnight.")}${periods("Dinner")}`)}
  ${sheet(`
    ${lastCall(S["SnapEats"], 5, 30, "#C0703A", "Last orders 9:45 · closes 10 pm", [item("SnapEats", "Cold Beverages", 0), item("SnapEats", "Street Flavours", 0)])}
    ${lastCall(S["Paid Mess"], 20, 30, "#C9A24A", "Last orders 10 pm · 1 in queue", [item("Paid Mess", "Rolls", 4), item("Paid Mess", "Momos", 1)])}
    <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; margin-top: 4px">
      <span aria-hidden="true" style="font-size: 22px">☾</span>
      <div style="flex: 1"><div style="font-size: 15px; font-weight: 600">3 night stalls open in the hostels</div><div style="font-size: 13px; color: ${ON_DECK}">Till midnight · open to everyone</div></div>${chevron()}
    </a>
    <div style="margin-top: 12px">${quietStall(S["House of Chow"], "Closed at 9 · opens 11 am")}</div>
  `)}`, { tabItems: TABS });

// ---------- 5 · 11:05 pm, night stalls ----------
const NIGHT = "#0D2418";
const NIGHT_STALLS = [
  { name: "Night Stall A Block", where: "Boys' hostel A · ground floor", q: "2 in queue", tint: "#E3EFE6", items: [{ name: "Masala Maggi", price: 50, veg: true }, { name: "Bread Omelette", price: 60, veg: false }] },
  { name: "Night Stall C Block", where: "Girls' hostel C · near the gate", q: "No queue", tint: "#F6EBD9", items: [{ name: "Aloo Parantha", price: 50, veg: true }, { name: "Cold Coffee", price: 60, veg: true }] },
];
const nightCard = (n) => `
  <div style="padding: 12px; border-radius: 18px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <a href="#" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; min-height: 44px">
      ${tile(n.name.replace("Night Stall ", ""), 44, n.tint, "13px")}
      <div style="flex: 1; min-width: 0"><div style="display: flex; justify-content: space-between; gap: 8px"><span style="font-family: ${SERIF}; font-size: 18px">${n.name}</span><span style="font-size: 12px; font-weight: 600; color: #1F6B43">${n.q}</span></div><div style="margin-top: 1px; font-size: 13px; color: ${MUTED}">${n.where}</div></div>
    </a>
    <div style="display: flex; gap: 6px; margin-top: 10px; overflow: hidden">${n.items.map(pick).join("")}</div>
  </div>`;
const night = `
<div style="width: 390px; height: 844px; box-sizing: border-box; background: ${NIGHT}; color: ${INK}; font-family: Inter, system-ui, sans-serif; position: relative; overflow: hidden; display: flex; flex-direction: column">
  <div aria-hidden="true" style="position: absolute; inset: 0 0 auto 0; height: 240px; background: radial-gradient(1.5px 1.5px at 40px 60px, #fff8, transparent), radial-gradient(1.5px 1.5px at 300px 40px, #fff6, transparent), radial-gradient(1px 1px at 210px 110px, #fff7, transparent), radial-gradient(1px 1px at 120px 30px, #fff5, transparent), radial-gradient(1.5px 1.5px at 350px 150px, #fff5, transparent)"></div>
  ${band(`${topRow("11:05 pm", "Night")}${bigTitle("Night stalls", "In the hostels · 55 min till midnight")}${periods("Night", true)}`)}
  ${sheet(`
    ${NIGHT_STALLS.map(nightCard).join("")}
    ${quietStall({ name: "Night Stall D Block" }, "Sold out for tonight")}
    <div style="margin-top: 14px; padding: 12px 14px; border-radius: 16px; background: #F5F7F4">
      ${eyebrow("Tomorrow morning")}
      <div style="margin-top: 4px; font-size: 14px">Mess breakfast isn't up yet. The first student in at 7:30 adds it, and you'll see it here at 8.</div>
    </div>
  `)}
  ${frame("", { tabItems: TABS }).match(/<nav[\s\S]*<\/nav>/)[0]}
</div>`;

export const DESIGNS = [
  { title: "1 · 8:10 am, before class", head, body: morning },
  { title: "2 · 1:10 pm, lunch rush", head, body: lunch },
  { title: "3 · Stall opens on lunch picks", head, body: stallPage },
  { title: "4 · 9:40 pm, last orders", head, body: closing },
  { title: "5 · 11 pm, night stalls", head, body: night },
];
