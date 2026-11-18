// Variety 2: the thumb dock. Everything you tap lives in the bottom third of
// the screen (stall dock, category strip, search, bag); the top is for
// reading. Switching stalls is one tap on the dock, never a trip back.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, sheet, chevron, bagIcon, tile, vegMark, dishRow, bottomSheet, STALLS,
  GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Thumb dock";
export const IDEA = "Stalls, sections, search and your bag sit in a dock at the bottom of the screen, so you can order with one thumb while walking.";

const snap = MENUS["SnapEats"];
const chow = MENUS["House of Chow"];
const cat = (menu, name) => menu.categories.find((c) => c.name === name);
const rolls = cat(snap, "Veg Kathi Rolls");
const coffee = cat(snap, "Cold Beverages").items[0];
const momos = cat(chow, "Momos (8 Pcs)");
const tileName = (n) => (n === "House of Chow" ? "House Chow" : n);
const shortName = { "SnapEats": "SnapEats", "House of Chow": "Chow", "Paid Mess": "Paid Mess", "Quench": "Quench" };

const eyebrow = (text, color = MUTED) => `<div style="font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: ${color}">${text}</div>`;

/** Bottom search bar that sits right above the tab bar. */
const dockSearch = (value = "") => `
  <label style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: #F2F5F1; border: 1px solid ${LINE}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search all stalls</span>
    <input placeholder="Search all stalls" value="${value}" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 16px; color: ${INK}">
    ${value ? `<button type="button" aria-label="Clear search" style="width: 32px; height: 32px; border: 0; border-radius: 999px; background: #DCE2DB; color: ${INK}; font-size: 16px">×</button>` : ""}
  </label>`;

/** The stall dock: 4 round stall buttons and the bag at the right. */
const stallDock = (active, bag = null) => `
  <div style="display: flex; align-items: center; gap: 4px">
    ${STALLS.map((s) => {
      const on = s.name === active;
      return `<a href="#" aria-label="${s.name}${s.open ? "" : " (paused)"}" ${on ? 'aria-current="true"' : ""} style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px 0; text-decoration: none; color: ${on ? GREEN : MUTED}; opacity: ${s.open ? 1 : 0.55}">
        <span style="border-radius: 999px; padding: 2px; border: 2px solid ${on ? GREEN : "transparent"}">${tile(tileName(s.name), 40, s.tint)}</span>
        <span style="font-size: 11px; font-weight: ${on ? 700 : 500}; white-space: nowrap">${shortName[s.name]}</span>
      </a>`;
    }).join("")}
    ${bag ? `<a href="#" aria-label="Bag, ${bag[0]} items, ₹${bag[1]}" style="flex-shrink: 0; height: 52px; padding: 0 14px; margin-left: 4px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700">${bagIcon(20)}${bag[0]} · ₹${bag[1]}</a>` : ""}
  </div>`;

/** Thumb zone: a white panel pinned above the tab bar. */
const thumbZone = (inner) => `
  <div style="position: absolute; left: 0; right: 0; bottom: 72px; padding: 10px 16px 10px; background: #FFFFFF; border-top: 1px solid ${LINE}; box-shadow: 0 -10px 24px -16px rgba(20,60,38,.35); border-radius: 22px 22px 0 0; z-index: 4">${inner}</div>`;

/** Category strip with an "all sections" button at the left. */
const catStrip = (menu, active) => {
  const names = menu.categories.map((c) => c.name);
  const start = Math.max(0, names.indexOf(active));
  return `
  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px">
    <button type="button" aria-label="All ${menu.categories.length} sections" style="flex-shrink: 0; height: 44px; padding: 0 12px; border-radius: 999px; border: 0; background: ${MINT}; color: ${MINT_INK}; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 4px">${chevron("up", 16)}${menu.categories.length}</button>
    <div style="display: flex; gap: 6px; overflow: hidden; flex: 1; min-width: 0; -webkit-mask-image: linear-gradient(90deg, #000 85%, transparent)">
      ${names.slice(start, start + 4).map((n) => `<span style="flex-shrink: 0; height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid ${n === active ? GREEN : "#DCE2DB"}; background: ${n === active ? GREEN : "#FFFFFF"}; color: ${n === active ? "#FFFFFF" : INK}; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; white-space: nowrap">${n}</span>`).join("")}
    </div>
  </div>`;
};

/** Compact reading header for a stall (top of the screen, nothing to tap). */
const stallHeader = (s, line) => band(`
  <div style="display: flex; align-items: center; justify-content: space-between">${logo}<span style="font-size: 13px; color: ${ON_DECK}">${line}</span></div>
  <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 10px">
    <h1 style="margin: 0; font-family: ${SERIF}; font-size: 30px; font-weight: 400">${s.name}</h1>
    <span style="font-size: 13px; color: ${ON_DECK}">${s.queue}</span>
  </div>`, "14px 20px 16px");

const sectionLabel = (name, count) => `
  <div style="display: flex; align-items: baseline; justify-content: space-between; margin: 4px 0 2px">
    <h2 style="margin: 0; font-family: ${SERIF}; font-size: 21px; font-weight: 400">${name}</h2><span style="font-size: 13px; color: ${MUTED}">${count} dishes</span>
  </div>`;

// 1 · Home: the top half is a glance, the bottom half is where you tap.
const home = frame(`
  ${band(`${logo}
    <h1 style="margin: 14px 0 2px; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; font-weight: 400">Hungry, Riya?</h1>
    <p style="margin: 0; font-size: 14px; color: ${ON_DECK}">3 stalls open · shortest wait at House of Chow</p>`)}
  ${sheet(`
    <a href="#" style="display: block; padding: 14px 16px; border-radius: 18px; background: ${MINT}; color: inherit; text-decoration: none">
      ${eyebrow("Mess lunch · now till 2:30", MINT_INK)}
      <div style="margin-top: 4px; font-size: 16px; font-weight: 500">Rajma, jeera rice, aloo gobi, roti, salad</div>
      <div style="margin-top: 3px; font-size: 13px; color: #3E5A48">₹70 day scholars · free for hostellers</div>
    </a>
    <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px; padding: 12px 14px; border-radius: 18px; border: 1px solid ${LINE}">
      ${tile("Paneer Kathi Roll", 44, "#E3EFE6")}
      <div style="flex: 1; min-width: 0">${eyebrow("Your usual · SnapEats")}<div style="margin-top: 3px; font-size: 15px; font-weight: 500; line-height: 1.3">Paneer Kathi Roll + Cold Coffee</div></div>
      <button type="button" style="flex-shrink: 0; height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: ${GREEN}; color: #FFFFFF; font-size: 14px; font-weight: 700">₹${rolls.items[1].price + coffee.price}</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px">
      ${[["3", "stalls open"], ["0 min", "wait at Chow"], ["5 pm", "mess snacks"]].map(([big, small]) => `<div style="padding: 10px 12px; border-radius: 14px; background: #F6F8F5"><div style="font-family: ${SERIF}; font-size: 22px">${big}</div><div style="font-size: 12px; color: ${MUTED}">${small}</div></div>`).join("")}
    </div>
  `)}
  ${thumbZone(`
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin: 2px 2px 8px">${eyebrow("Pick a stall")}<span style="font-size: 12px; color: ${MUTED}">wait shown live</span></div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
      ${STALLS.map((s) => `<a href="#" style="display: flex; align-items: center; gap: 10px; height: 76px; padding: 0 12px; border-radius: 16px; background: ${s.open ? s.tint : "#F1F2F0"}; color: inherit; text-decoration: none; opacity: ${s.open ? 1 : 0.7}">
        ${tile(tileName(s.name), 44, "#FFFFFF")}
        <span style="min-width: 0"><span style="display: block; font-family: ${SERIF}; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${s.name}</span><span style="display: block; font-size: 12px; font-weight: 600; color: ${s.open ? "#1F6B43" : "#9A5B13"}">${s.open ? s.queue : "Paused"}</span></span>
      </a>`).join("")}
    </div>
    <div style="margin-top: 10px">${dockSearch()}</div>
  `)}`);

// 2 · Stall menu: one section at a time on top, strip + dock under the thumb.
const stallMenu = frame(`
  ${stallHeader(STALLS[0], "Open till 10 pm")}
  ${sheet(`
    ${sectionLabel(rolls.name, rolls.count)}
    ${rolls.items.slice(0, 6).map((it, i) => dishRow(it, { qty: i === 1 ? 1 : 0 })).join("")}
    <p style="margin: 10px 0 0; font-size: 13px; color: ${MUTED}; text-align: center">Swipe the strip at the bottom for the next section</p>
  `, "padding-bottom: 0")}
  ${thumbZone(`${catStrip(snap, rolls.name)}${stallDock("SnapEats", [1, rolls.items[1].price])}`)}`);

// 3 · All sections: a 230-dish menu folded into big buttons you reach with a thumb.
const chowDrinks = ["Chai Pe Charcha", "Shakes", "Exotic Shakes", "Coolers", "Mojitos"];
const chowFood = chow.categories.filter((c) => !chowDrinks.includes(c.name));
const sections = frame(`
  ${stallHeader(STALLS[1], "Open till 9 pm")}
  ${sheet(`${sectionLabel(momos.name, momos.count)}${momos.items.slice(0, 2).map((it) => dishRow(it)).join("")}`)}`, {
  overlay: bottomSheet(`
    <div style="display: flex; align-items: baseline; justify-content: space-between"><span style="font-family: ${SERIF}; font-size: 22px">Jump to a section</span><span style="font-size: 13px; color: ${MUTED}">230 dishes</span></div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 12px">
      ${chowFood.slice(0, 20).map((c) => `<button type="button" style="height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid ${c.name === momos.name ? GREEN : LINE}; background: ${c.name === momos.name ? MINT : "#FFFFFF"}; color: ${INK}; display: flex; align-items: center; justify-content: space-between; gap: 6px; text-align: left; font-size: 13px; font-weight: 600"><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${c.name.replace("Multigrain Chinese", "Multigrain")}</span><span style="flex-shrink: 0; font-weight: 500; color: ${MUTED}">${c.count}</span></button>`).join("")}
    </div>
    <div style="position: absolute; left: 20px; right: 20px; bottom: 20px">
      <div role="group" aria-label="Show" style="display: grid; grid-template-columns: 1fr 1fr 1fr; height: 50px; padding: 4px; border-radius: 999px; background: #F2F5F1; box-sizing: border-box">
        ${[["Food", true], ["Drinks", false], ["Veg only", false]].map(([l, on]) => `<button type="button" aria-pressed="${on}" style="border: 0; border-radius: 999px; background: ${on ? GREEN : "transparent"}; color: ${on ? "#FFFFFF" : INK}; font-size: 14px; font-weight: 700">${l}</button>`).join("")}
      </div>
    </div>`, "82%"),
});

// 4 · Search grows upward from the bar, so the best match sits nearest the thumb.
const hits = [];
for (const [stall, menu] of Object.entries(MENUS)) for (const c of menu.categories) for (const it of c.items) if (/momo/i.test(it.name)) hits.push({ ...it, stall });
const byStall = ["Paid Mess", "SnapEats", "House of Chow"].map((s) => [s, hits.filter((h) => h.stall === s)]);
const hitRow = (it) => `
  <div style="display: flex; align-items: center; gap: 10px; min-height: 48px; border-bottom: 1px solid #EEF1ED">
    ${vegMark(it.veg)}<span style="flex: 1; min-width: 0; font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span>
    <span style="font-size: 14px; color: ${MUTED}">₹${it.price}</span>
    <button type="button" aria-label="Add ${it.name}" style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px; color: ${INK}">+</button>
  </div>`;
const search = frame(`
  ${band(`<div style="display: flex; align-items: center; justify-content: space-between">${logo}<span style="font-size: 13px; color: ${ON_DECK}">${hits.length} momos at 3 stalls</span></div>`, "14px 20px 16px")}
  <main style="flex: 1; overflow: hidden; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 0 20px 210px; display: flex; flex-direction: column; justify-content: flex-end">
    <button type="button" style="align-self: center; display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; font-size: 14px; font-weight: 600">${chevron("up", 16)} ${hits.length - 8} more matches</button>
    ${byStall.map(([s, list]) => {
      const st = STALLS.find((x) => x.name === s);
      return `<div style="margin-top: 12px"><div style="display: flex; justify-content: space-between; align-items: center">${eyebrow(s)}<span style="font-size: 12px; font-weight: 600; color: #1F6B43">${st.queue}</span></div>${list.slice(0, s === "House of Chow" ? 4 : 2).map(hitRow).join("")}</div>`;
    }).join("")}
  </main>
  ${thumbZone(`
    <div style="display: flex; gap: 6px; margin-bottom: 8px">
      ${["Veg", "Under ₹120", "Fastest pickup"].map((l, i) => `<button type="button" aria-pressed="${i === 2}" style="height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid ${i === 2 ? GREEN : "#DCE2DB"}; background: ${i === 2 ? GREEN : "#FFFFFF"}; color: ${i === 2 ? "#FFFFFF" : INK}; font-size: 14px; font-weight: 600; white-space: nowrap">${l}</button>`).join("")}
    </div>
    ${dockSearch("momo")}`)}`);

// 5 · Bag: slots and the place button are the lowest things on screen.
const roll = rolls.items[1];
const momo = momos.items[0];
const total = roll.price + coffee.price + 2 * momo.price;
const slotRow = (stall, chosen) => `
  <div style="margin-top: 10px">
    ${eyebrow(`${stall} · pick up at`)}
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px">
      ${["1:00", "1:15", "1:30", "1:45"].map((t) => `<button type="button" aria-pressed="${t === chosen}" style="height: 44px; border-radius: 12px; border: 1px solid ${t === chosen ? GREEN : "#DCE2DB"}; background: ${t === chosen ? GREEN : "#FFFFFF"}; color: ${t === chosen ? "#FFFFFF" : INK}; font-size: 15px; font-weight: 700">${t}</button>`).join("")}
    </div>
  </div>`;
const bagLine = (it, qty, stall) => `
  <div style="display: flex; align-items: center; gap: 8px; min-height: 40px; font-size: 15px">${vegMark(it.veg)}<span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${qty} × ${it.name}</span><span style="font-size: 13px; color: ${MUTED}">${stall}</span><span style="width: 52px; text-align: right; font-weight: 600">₹${qty * it.price}</span></div>`;
const bag = frame(`
  ${stallHeader(STALLS[1], "Open till 9 pm")}
  ${sheet("")}`, {
  tabBar: false,
  overlay: bottomSheet(`
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 24px">Your bag</span><span style="font-size: 13px; color: ${MUTED}">2 stalls · pay at the counter</span></div>
    <div style="margin-top: 8px; padding: 4px 0; border-top: 1px solid ${LINE}; border-bottom: 1px solid ${LINE}">
      ${bagLine(roll, 1, "SnapEats")}${bagLine(coffee, 1, "SnapEats")}${bagLine(momo, 2, "Chow")}
    </div>
    ${slotRow("SnapEats", "1:15")}
    ${slotRow("House of Chow", "1:15")}
    <div style="position: absolute; left: 20px; right: 20px; bottom: 24px">
      <a href="#" style="height: 60px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; justify-content: space-between; padding: 0 8px 0 24px; font-size: 17px; font-weight: 700">Place pre-order · ₹${total}<span style="width: 44px; height: 44px; border-radius: 999px; background: rgba(255,255,255,.16); display: flex; align-items: center; justify-content: center">${chevron("right", 22)}</span></a>
    </div>`, "64%"),
});

export const DESIGNS = [
  { title: "1 · Home: glance up, tap down", head, body: home },
  { title: "2 · Stall menu with the dock", head, body: stallMenu },
  { title: "3 · Jump to any section", head, body: sections },
  { title: "4 · Search from the bottom", head, body: search },
  { title: "5 · Bag within thumb reach", head, body: bag },
];
