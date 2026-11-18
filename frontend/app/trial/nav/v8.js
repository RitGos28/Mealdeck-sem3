// Variety 8: a campus map home. Stalls sit where they really are; you set
// your spot (no GPS), everything is sorted by walking minutes, and pickup
// slots are timed to the walk. Locations, walk times and queues are sample.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, sectionTitle, chip, chipRow, tile, vegMark, plusButton, stepper,
  STALLS, statusDot, bagPill, bottomSheet, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Campus map";
export const IDEA = "See the stalls on a map of campus, sorted by how far they are from your block, and get a pickup time that matches your walk.";

const TABS = [["stalls", "Campus"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]];
const chow = MENUS["House of Chow"];
const snap = MENUS["SnapEats"];
const byName = Object.fromEntries(STALLS.map((s) => [s.name, s]));

// Sample geography: where each stall is and how far it is from Hostel H2.
const PLACES = {
  "House of Chow": { where: "Food court, ground floor", walk: 3, x: 206, y: 144 },
  SnapEats: { where: "Food court, ground floor", walk: 3, x: 146, y: 144 },
  "Paid Mess": { where: "Next to Hostel H3", walk: 4, x: 290, y: 252 },
  Quench: { where: "Library lawn kiosk", walk: 6, x: 292, y: 56 },
};
const PIN_TEXT = { SnapEats: "SE", "House of Chow": "HC", "Paid Mess": "PM", Quench: "Q" };
const MESS_AT = { x: 62, y: 144 };
const YOU = { x: 176, y: 262 };

const label = (text, x, y) => `<text x="${x}" y="${y}" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#7B8A81" letter-spacing=".04em">${text}</text>`;
const block = (name, x, y, w, h, fill = "#FFFFFF") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="#D9E2DA"/>${label(name, x + 8, y + 16)}`;

function pin(name, { active = false, dim = false } = {}) {
  const p = PLACES[name];
  const s = byName[name];
  const r = active ? 19 : 15;
  return `<g opacity="${dim ? 0.5 : 1}">
    ${active ? `<circle cx="${p.x}" cy="${p.y}" r="27" fill="${GREEN}" opacity=".14"/>` : ""}
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${active ? GREEN : s.tint}" stroke="${s.open ? GREEN : "#9AA59E"}" stroke-width="2"/>
    <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-family="${SERIF}" font-size="${active ? 14 : 12}" fill="${active ? "#FFFFFF" : MINT_INK}">${PIN_TEXT[name]}</text>
  </g>`;
}

/** Inline SVG map of a (sample) campus. */
function campusMap({ active = "", route = "", height = 296, routeTwo = false } = {}) {
  const paths = {
    "House of Chow": `M${YOU.x} ${YOU.y - 10} L176 200 L206 200 L206 ${144 + 20}`,
  };
  return `<svg width="350" height="${height}" viewBox="0 0 350 296" role="img" aria-label="Campus map: stalls and your spot, Hostel H2" style="display: block; border-radius: 18px; background: #EDF4EE">
    <path d="M0 92 H350 M0 202 H350 M112 0 V296 M240 0 V296" stroke="#FFFFFF" stroke-width="14"/>
    ${block("A-BLOCK", 14, 14, 90, 66)}${block("B-BLOCK", 122, 14, 108, 66)}${block("LIBRARY", 248, 14, 88, 66)}
    ${block("MESS", 14, 106, 90, 84, "#F7F3E8")}${block("FOOD COURT", 122, 106, 108, 84, "#FFFFFF")}${block("C-BLOCK", 248, 106, 88, 84)}
    ${block("HOSTEL H1", 14, 214, 90, 70)}${block("HOSTEL H2", 122, 214, 108, 70, active || route ? "#FFFFFF" : "#FFFFFF")}${block("HOSTEL H3", 248, 214, 88, 70)}
    <g aria-hidden="true"><circle cx="${MESS_AT.x}" cy="${MESS_AT.y + 8}" r="15" fill="#FFFFFF" stroke="#B48A2C" stroke-width="2"/><path d="M${MESS_AT.x - 7} ${MESS_AT.y + 10}h14M${MESS_AT.x - 5} ${MESS_AT.y + 10}a5 5 0 0 1 10 0" stroke="#8A6A1F" stroke-width="1.6" fill="none"/></g>
    ${route ? `<path d="${paths[route]}" fill="none" stroke="${GREEN}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>` : ""}
    ${routeTwo ? `<path d="M${YOU.x} ${YOU.y - 10} L176 200 L146 200 L146 164 M166 144 L186 144" fill="none" stroke="${GREEN}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>` : ""}
    ${["SnapEats", "House of Chow", "Paid Mess", "Quench"].map((n) => pin(n, { active: n === active || (routeTwo && n !== "Paid Mess" && n !== "Quench"), dim: !byName[n].open || ((active || routeTwo) && n !== active && !(routeTwo && (n === "SnapEats" || n === "House of Chow"))) })).join("")}
    <circle cx="${YOU.x}" cy="${YOU.y}" r="13" fill="#2F7DE1" opacity=".18"/><circle cx="${YOU.x}" cy="${YOU.y}" r="6.5" fill="#2F7DE1" stroke="#FFFFFF" stroke-width="2.5"/>
    <text x="${YOU.x + 12}" y="${YOU.y + 4}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#1D5DB0">You</text>
  </svg>`;
}

const spotPill = (where = "Hostel H2") => `<button type="button" aria-label="Change your spot, now ${where}" style="margin-top: 12px; min-height: 44px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.1); color: #FFFFFF; font-size: 14px; font-weight: 600">
  <span style="width: 10px; height: 10px; border-radius: 999px; background: #6FA8F0; box-shadow: 0 0 0 3px rgba(111,168,240,.3)"></span>I'm at ${where}${chevron("down", 16)}</button>`;

const walkBadge = (min, dim = false) => `<div style="width: 50px; flex-shrink: 0; text-align: center; color: ${dim ? MUTED : GREEN}"><div style="font-family: ${SERIF}; font-size: 22px; line-height: 1">${min}</div><div style="font-size: 11px; font-weight: 600; letter-spacing: .03em">MIN WALK</div></div>`;

const nearRow = (name) => {
  const s = byName[name];
  const p = PLACES[name];
  return `<a href="#" style="display: flex; align-items: center; gap: 10px; min-height: 54px; padding: 4px 0; border-bottom: 1px solid #EEF1ED; text-decoration: none; color: inherit">
    ${walkBadge(p.walk, !s.open)}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><span style="font-size: 15px; font-weight: 600">${name}</span>${statusDot(s)}</div>
    <div style="margin-top: 2px; font-size: 13px; color: ${MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${p.where} · ${s.queue}</div></div>
  </a>`;
};

// 1 · Map home
const home = frame(`
  ${band(`<div style="display: flex; justify-content: space-between; align-items: center">${logo}<span style="font-size: 13px; color: ${ON_DECK}">Thu · 12:58 pm</span></div>${spotPill()}`, "14px 20px 18px")}
  ${sheet(`
    ${campusMap()}
    <p style="margin: 6px 2px 10px; font-size: 11px; color: #8A968F">Sample map and walk times · set your spot by hand, no location tracking</p>
    ${sectionTitle("Closest to you", "from Hostel H2")}
    ${["House of Chow", "SnapEats", "Paid Mess", "Quench"].map(nearRow).join("")}
  `, "padding-top: 16px")}`, { tabItems: TABS, activeTab: "stalls" });

// 2 · Tap a pin
const preview = frame(`
  ${band(`<div style="display: flex; justify-content: space-between; align-items: center">${logo}<span style="font-size: 13px; color: ${ON_DECK}">Thu · 12:58 pm</span></div>${spotPill()}`, "14px 20px 18px")}
  ${sheet(campusMap({ active: "House of Chow", route: "House of Chow" }), "padding-top: 16px")}`, {
  tabItems: TABS,
  activeTab: "stalls",
  overlay: `
  <div role="dialog" aria-label="House of Chow" style="position: absolute; left: 0; right: 0; bottom: 0; height: 430px; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 10px 20px 24px; box-sizing: border-box; z-index: 9; box-shadow: 0 -18px 40px -16px rgba(11,31,20,.35)">
    <div style="width: 40px; height: 4px; border-radius: 999px; background: #DCE2DB; margin: 0 auto 14px"></div>
    <div style="display: flex; align-items: center; gap: 12px">
      ${tile("House of Chow", 52, byName["House of Chow"].tint, "14px")}
      <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 24px; line-height: 1.1">House of Chow</div><div style="margin-top: 3px; font-size: 13px; color: ${MUTED}">Food court, ground floor · 230 dishes</div></div>
      <button type="button" aria-label="Close" style="width: 44px; height: 44px; border-radius: 999px; border: 1px solid ${LINE}; background: #FFFFFF; font-size: 20px; color: ${MUTED}">×</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px">
      ${[["3 min", "walk from H2"], ["No queue", "right now"], ["9 pm", "open till"]].map(([a, b]) => `<div style="padding: 10px 8px; border-radius: 14px; background: #F4F7F4; text-align: center"><div style="font-size: 16px; font-weight: 700; color: ${GREEN}">${a}</div><div style="margin-top: 2px; font-size: 12px; color: ${MUTED}">${b}</div></div>`).join("")}
    </div>
    <div style="margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: ${MINT}; color: ${MINT_INK}; font-size: 14px; line-height: 1.4">
      <b>Order now, leave at 1:12</b> — your food is ready at the <b>1:15</b> slot just as you walk in.
    </div>
    <div style="margin-top: 12px; font-size: 13px; color: ${MUTED}">Same building: <b style="color: ${INK}">SnapEats</b> is 20 steps away — add from both, pick up together.</div>
    <div style="display: flex; gap: 10px; margin-top: 18px">
      <a href="#" style="flex: 1; height: 50px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600">See the menu${chevron("right", 16)}</a>
      <button type="button" style="height: 50px; padding: 0 18px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; font-weight: 600">Both menus</button>
    </div>
  </div>`,
});

// 3 · Big menu: category rail on the left, one long list on the right
const momos = chow.categories.find((c) => c.name === "Momos (8 Pcs)");
const rollsC = chow.categories.find((c) => c.name === "Chinese Rolls");
const shortCat = (n) => n.replace(" (8 Pcs)", "").replace("Multigrain Chinese Sandwiches", "Multigrain Sandwiches");
const rail = chow.categories.slice(0, 14).map((c) => {
  const on = c.name === momos.name;
  return `<a href="#" ${on ? 'aria-current="true"' : ""} style="display: flex; align-items: center; min-height: 44px; padding: 4px 10px 4px 12px; box-sizing: border-box; border-left: 3px solid ${on ? GREEN : "transparent"}; background: ${on ? "#FFFFFF" : "transparent"}; color: ${on ? GREEN : "#3E4C44"}; font-size: 13px; font-weight: ${on ? 700 : 500}; line-height: 1.25; text-decoration: none">${shortCat(c.name)}</a>`;
}).join("");
const compactRow = (item, qty = 0) => `
  <div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #EEF1ED">
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: flex-start; gap: 6px"><span style="margin-top: 3px">${vegMark(item.veg)}</span><span style="font-size: 14px; font-weight: 500; line-height: 1.3">${item.name}</span></div><div style="margin: 3px 0 0 19px; font-size: 14px; color: ${MUTED}">₹${item.price}</div></div>
    ${qty ? stepper(qty) : plusButton(item.name)}
  </div>`;
const catHead = (c) => `<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0 2px"><h3 style="margin: 0; font-family: ${SERIF}; font-size: 18px; font-weight: 400">${shortCat(c.name)}</h3><span style="font-size: 12px; color: ${MUTED}">${c.count}</span></div>`;

const menu = frame(`
  ${band(`${backLink("Campus map")}<h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">House of Chow</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">3 min walk · No queue · 230 dishes in 25 sections</p>`, "14px 20px 16px")}
  <main style="flex: 1; overflow: hidden; background: #FFFFFF; border-radius: 24px 24px 0 0; display: flex; flex-direction: column">
    <div style="padding: 14px 16px 10px; border-bottom: 1px solid ${LINE}">
      <label style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; background: #F2F5F2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search House of Chow</span>
        <input placeholder="Search 230 dishes here" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 16px; color: ${INK}">
      </label>
      ${chipRow([chip("Veg only"), chip("Under ₹100"), chip("Drinks")].join(""), "margin-top: 10px")}
    </div>
    <div style="flex: 1; display: flex; min-height: 0">
      <nav aria-label="Menu sections" style="width: 118px; flex-shrink: 0; background: #F4F7F4; overflow: hidden; padding: 6px 0 90px">${rail}</nav>
      <div style="flex: 1; min-width: 0; padding: 0 16px 90px; overflow: hidden">
        ${catHead(momos)}${momos.items.map((it, i) => compactRow(it, i === 1 ? 1 : 0)).join("")}
        ${catHead(rollsC)}${rollsC.items.slice(0, 3).map((it) => compactRow(it)).join("")}
      </div>
    </div>
  </main>
  ${bagPill(1, momos.items[1].price)}`, { tabItems: TABS, activeTab: "stalls" });

// 4 · Bag = a planned run: stops in walking order, slots timed to the walk
const kurkure = momos.items[1];
const coldCoffee = snap.categories.find((c) => c.name === "Cold Beverages").items[0];
const fries = snap.categories.find((c) => c.name === "Crispy Snacks").items[1];
const total = kurkure.price + coldCoffee.price + fries.price;
const stop = (n, name, time, items, last = false) => `
  <div style="display: flex; gap: 12px">
    <div style="display: flex; flex-direction: column; align-items: center; width: 28px"><span style="width: 28px; height: 28px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center">${n}</span>${last ? "" : '<span style="flex: 1; width: 2px; margin: 4px 0; background: repeating-linear-gradient(#9DB8A6 0 4px, transparent 4px 8px)"></span>'}</div>
    <div style="flex: 1; min-width: 0; padding-bottom: ${last ? 0 : 12}px">
      <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 15px; font-weight: 700">${name}</span><span style="font-size: 13px; font-weight: 600; color: ${GREEN}">ready ${time}</span></div>
      ${items.map((it) => `<div style="display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 14px">${vegMark(it.veg)}<span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span><span style="color: ${MUTED}">₹${it.price}</span></div>`).join("")}
    </div>
  </div>`;
const run = frame(`
  ${band(`${backLink("House of Chow")}<h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">Your food run</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">2 stalls · one trip to the food court</p>`, "14px 20px 16px")}
  ${sheet(`
    <div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 16px; background: #EDF4EE">
      ${campusMap({ routeTwo: true, height: 120 }).replace('width="350"', 'width="138"').replace('height="120"', 'height="117"')}
      <div style="flex: 1; min-width: 0">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: .05em; color: ${MINT_INK}">LEAVE H2 AT</div>
        <div style="font-family: ${SERIF}; font-size: 34px; line-height: 1.05; color: ${GREEN}">1:12 pm</div>
        <div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">3 min walk, both stalls side by side</div>
      </div>
    </div>
    <h2 style="margin: 18px 0 10px; font-family: ${SERIF}; font-size: 20px; font-weight: 400">Pick up slot</h2>
    ${chipRow(["1:00", "1:15 · fits your walk", "1:30"].map((t, i) => chip(t, { on: i === 1 })).join(""), "flex-wrap: wrap")}
    <div style="margin-top: 18px">
      ${stop(1, "SnapEats", "1:15", [coldCoffee, fries])}
      ${stop(2, "House of Chow", "1:15", [kurkure], true)}
    </div>
    <label style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; margin-top: 14px; padding: 0 14px; border-radius: 14px; border: 1px solid ${LINE}; font-size: 14px">
      <span>Nudge me when it's time to leave</span>
      <span aria-hidden="true" style="width: 44px; height: 26px; border-radius: 999px; background: ${GREEN}; position: relative; flex-shrink: 0"><span style="position: absolute; right: 3px; top: 3px; width: 20px; height: 20px; border-radius: 999px; background: #FFFFFF"></span></span>
      <input type="checkbox" checked aria-label="Nudge me when it's time to leave" style="position: absolute; opacity: 0; width: 1px; height: 1px">
    </label>
    <button type="button" style="width: 100%; height: 52px; margin-top: 14px; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 16px; font-weight: 600">Place pre-order · ₹${total}</button>
    <p style="margin: 8px 0 0; text-align: center; font-size: 12px; color: ${MUTED}">Pay at each counter when you pick up</p>
  `, "padding-bottom: 20px")}`, { tabBar: false });

// 5 · The mess is a place on the map too
const meal = (name, dishes, note, on = false) => `
  <div style="padding: 12px 14px; border-radius: 16px; border: 1px solid ${on ? GREEN : LINE}; ${on ? `background: #F6FAF7;` : ""} margin-bottom: 8px">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 18px">${name}</span><span style="font-size: 12px; font-weight: ${on ? 700 : 500}; color: ${on ? GREEN : MUTED}">${note}</span></div>
    <div style="margin-top: 4px; font-size: 14px; color: ${dishes ? INK : MUTED}">${dishes || "Not added yet — be the first"}</div>
  </div>`;
const mess = frame(`
  ${band(`${backLink("Campus map")}<h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">Mess · Dining hall</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">5 min walk from H2 · menu added by students</p>`, "14px 20px 16px")}
  ${sheet(`
    ${meal("Breakfast", "Poha, boiled egg, bread butter, tea", "done")}
    ${meal("Lunch", "Rajma, jeera rice, aloo gobi, roti, salad", "now · till 2:30", true)}
    <div style="display: flex; gap: 8px; margin: -2px 0 10px">
      <button type="button" style="flex: 1; min-height: 44px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; font-size: 14px; font-weight: 600">This isn't correct</button>
      <span style="display: flex; align-items: center; padding: 0 4px; font-size: 12px; color: ${MUTED}">Added 12:10 pm</span>
    </div>
    ${meal("Snacks", "", "4:30 pm")}
    ${meal("Dinner", "", "7:30 pm")}
    <p style="margin: 4px 0 14px; font-size: 12px; color: ${MUTED}">₹70 lunch for day scholars · free for hostellers · 3 "isn't correct" votes swap in the most common fix</p>
    <div style="padding: 12px 14px; border-radius: 16px; background: ${MINT}; color: ${MINT_INK}">
      <div style="font-size: 12px; font-weight: 700; letter-spacing: .05em">NOT FEELING RAJMA?</div>
      <a href="#" style="display: flex; align-items: center; gap: 10px; min-height: 44px; margin-top: 4px; color: inherit; text-decoration: none">
        <span style="flex: 1; font-size: 14px; line-height: 1.35"><b>Food court</b> is 2 min from the mess — SnapEats and House of Chow, both no wait</span>${chevron("right")}
      </a>
    </div>
  `)}`, { tabItems: TABS, activeTab: "mess" });

export const DESIGNS = [
  { title: "1 · Campus map home", head, body: home },
  { title: "2 · Tap a stall pin", head, body: preview },
  { title: "3 · Menu with section rail", head, body: menu },
  { title: "4 · Bag as a food run", head, body: run },
  { title: "5 · The mess on the map", head, body: mess },
];
