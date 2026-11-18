// Variety 3: shelves. Home is a stack of stall shelves showing each stall's
// most-ordered dishes, with + right on the card, so most orders never open a
// stall page. Full menus are sliced by budget, and after ordering you get a
// big pickup pass you can read at a glance while walking.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, sheet, chevron, tile, vegMark, backLink, STALLS,
  GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Shelves and quick add";
export const IDEA = "Home shows each stall's most-ordered dishes on a shelf you can add from directly, so a usual order takes two taps without opening a menu.";

const snap = MENUS["SnapEats"];
const chow = MENUS["House of Chow"];
const mess = MENUS["Paid Mess"];
const item = (menu, cat, i) => ({ ...menu.categories.find((c) => c.name === cat).items[i] });
const stall = (n) => STALLS.find((s) => s.name === n);
const tileName = (n) => (n === "House of Chow" ? "House Chow" : n);

const eyebrow = (text, color = MUTED) => `<div style="font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: ${color}">${text}</div>`;

const shelves = {
  "SnapEats": [item(snap, "Veg Kathi Rolls", 1), item(snap, "Cold Beverages", 0), item(snap, "Burgers", 1), item(snap, "Crispy Snacks", 1)],
  "House of Chow": [item(chow, "Momos (8 Pcs)", 0), item(chow, "Noodles", 5), item(chow, "Veg Appetizers", 3), item(chow, "Mojitos", 0)],
  "Paid Mess": [item(mess, "Veg Rice & Noodle Bowl", 0), item(mess, "Biryani - Rice - Raita", 1), item(mess, "Rolls", 4), item(mess, "Momos", 1)],
};
const usuals = [
  { ...shelves["SnapEats"][0], from: "SnapEats" },
  { ...shelves["House of Chow"][0], from: "House of Chow", qty: 2 },
  { ...shelves["SnapEats"][1], from: "SnapEats" },
];

const addBtn = (name) => `<button type="button" aria-label="Add ${name}" style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 20px; color: ${INK}">+</button>`;
const miniStepper = (name, qty) => `<div role="group" aria-label="${name} quantity" style="display: flex; align-items: center; height: 44px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF"><button type="button" aria-label="Remove one" style="width: 36px; height: 44px; border: 0; background: transparent; color: inherit; font-size: 18px">−</button><span style="min-width: 10px; text-align: center; font-size: 15px; font-weight: 700">${qty}</span><button type="button" aria-label="Add one" style="width: 36px; height: 44px; border: 0; background: transparent; color: inherit; font-size: 18px">+</button></div>`;

/** A dish card on a shelf: tile, name (2 lines), price, + or stepper. */
const card = (it, { qty = 0, tint = MINT, note = "" } = {}) => `
  <div style="flex-shrink: 0; width: 160px; box-sizing: border-box; padding: 12px; border-radius: 18px; border: 1px solid ${qty ? GREEN : LINE}; background: ${qty ? "#F4FAF6" : "#FFFFFF"}; display: flex; flex-direction: column; gap: 8px">
    <div style="display: flex; justify-content: space-between; align-items: flex-start">${tile(it.name, 40, tint, "12px")}${vegMark(it.veg)}</div>
    <div style="font-size: 14px; font-weight: 600; line-height: 1.25; height: 36px; overflow: hidden">${it.name}</div>
    ${note ? `<div style="font-size: 12px; color: ${MUTED}; margin-top: -6px">${note}</div>` : ""}
    <div style="display: flex; align-items: center; justify-content: space-between"><span style="font-size: 15px; font-weight: 600">₹${it.price}</span>${qty ? miniStepper(it.name, qty) : addBtn(it.name)}</div>
  </div>`;

const shelf = (name, { qtys = {}, label } = {}) => {
  const s = stall(name);
  return `
  <section style="margin-top: 18px" aria-label="${name}">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
      <div style="min-width: 0"><h2 style="margin: 0; font-family: ${SERIF}; font-size: 20px; font-weight: 400">${label ?? name}</h2><div style="font-size: 12px; color: ${MUTED}">${s.queue} · ${s.dishes} dishes</div></div>
      <a href="#" style="flex-shrink: 0; height: 44px; display: flex; align-items: center; gap: 2px; padding: 0 4px 0 12px; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">Full menu${chevron("right", 16)}</a>
    </div>
    <div style="display: flex; gap: 8px; margin: 8px -20px 0; padding: 0 20px; overflow: hidden">${shelves[name].map((it, i) => card(it, { qty: qtys[i] ?? 0, tint: s.tint })).join("")}</div>
  </section>`;
};

const messStrip = `
  <a href="#" style="display: flex; align-items: center; gap: 10px; margin-top: 14px; height: 48px; padding: 0 14px; border-radius: 14px; background: rgba(255,255,255,.1); color: #FFFFFF; text-decoration: none">
    <span style="font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${ON_DECK}">Mess lunch</span>
    <span style="flex: 1; min-width: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Rajma, jeera rice, aloo gobi</span>${chevron("right", 16)}
  </a>`;

const homeBand = band(`
  <div style="display: flex; align-items: center; justify-content: space-between">${logo}<a href="#" aria-label="Search" style="width: 44px; height: 44px; margin-right: -10px; display: flex; align-items: center; justify-content: center; color: #FFFFFF"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a></div>
  <h1 style="margin: 6px 0 0; font-family: ${SERIF}; font-size: 28px; line-height: 1.1; font-weight: 400">What are you having?</h1>
  ${messStrip}`, "10px 20px 18px");

/** Bag bar: count, pickup slot and place button in one strip above the tabs. */
const bagBar = (count, total, slot) => `
  <div style="position: absolute; left: 12px; right: 12px; bottom: 82px; height: 64px; padding: 0 8px 0 18px; border-radius: 20px; background: ${GREEN}; color: #FFFFFF; display: flex; align-items: center; gap: 10px; box-shadow: 0 14px 30px -12px rgba(20,60,38,.7); z-index: 6">
    <div style="flex: 1; min-width: 0"><div style="font-size: 15px; font-weight: 700">${count} items · ₹${total}</div><a href="#" style="display: inline-flex; align-items: center; gap: 2px; font-size: 13px; color: ${ON_DECK}; text-decoration: none">Pick up ${slot} · change${chevron("down", 14)}</a></div>
    <button type="button" style="height: 48px; padding: 0 18px; border-radius: 999px; border: 0; background: #FFFFFF; color: ${GREEN}; font-size: 15px; font-weight: 700">Place order</button>
  </div>`;

// 1 · Home: your usuals, then a shelf per open stall.
const usualsShelf = `
  <section aria-label="Order again">
    <div style="display: flex; align-items: baseline; justify-content: space-between"><h2 style="margin: 0; font-family: ${SERIF}; font-size: 20px; font-weight: 400">Order again</h2><span style="font-size: 12px; color: ${MUTED}">from your last 5 orders</span></div>
    <div style="display: flex; gap: 8px; margin: 8px -20px 0; padding: 0 20px; overflow: hidden">${usuals.map((u) => card(u, { tint: stall(u.from).tint, note: u.from })).join("")}</div>
  </section>`;
const home = frame(`${homeBand}${sheet(`${usualsShelf}${shelf("SnapEats")}${shelf("House of Chow")}`)}`);

// 2 · Quick add: two taps on shelves, bag bar shows up with a default slot.
const totalQ = shelves["SnapEats"][0].price + 2 * shelves["House of Chow"][0].price;
const quickAdd = frame(`${homeBand}${sheet(`${shelf("SnapEats", { qtys: { 0: 1 } })}${shelf("House of Chow", { qtys: { 0: 2 } })}${shelf("Paid Mess")}`, "padding-top: 0")}${bagBar(3, totalQ, "1:15")}`);

// 3 · Full menu, sliced by budget: a 231-dish menu becomes a short list.
const budgets = ["Under ₹100", "₹100–150", "₹150–250", "₹250+"];
const inBand = (p) => p >= 100 && p <= 150;
const messItems = [];
for (const c of mess.categories) for (const it of c.items) if (inBand(it.price) && it.veg) messItems.push({ ...it, cat: c.name });
const menuRow = (it) => `
  <div style="display: flex; align-items: center; gap: 10px; min-height: 56px; border-bottom: 1px solid #EEF1ED">
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(it.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span></div><div style="margin-top: 2px; font-size: 12px; color: ${MUTED}">${it.cat}</div></div>
    <span style="font-size: 15px; font-weight: 600">₹${it.price}</span>${addBtn(it.name)}
  </div>`;
const fullMenu = frame(`
  ${band(`<a href="#" style="display: inline-flex; min-height: 44px; align-items: center; color: inherit; text-decoration: none">${backLink("Shelves")}</a>
    <div style="display: flex; align-items: baseline; justify-content: space-between"><h1 style="margin: 0; font-family: ${SERIF}; font-size: 30px; font-weight: 400">Paid Mess</h1><span style="font-size: 13px; color: ${ON_DECK}">3 in queue · ~12 min</span></div>`, "4px 20px 18px")}
  ${sheet(`
    ${eyebrow("What's your budget?")}
    <div role="group" aria-label="Budget" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px">
      ${budgets.map((b) => `<button type="button" aria-pressed="${b === "₹100–150"}" style="height: 48px; padding: 0 4px; border-radius: 14px; border: 1px solid ${b === "₹100–150" ? GREEN : "#DCE2DB"}; background: ${b === "₹100–150" ? GREEN : "#FFFFFF"}; color: ${b === "₹100–150" ? "#FFFFFF" : INK}; font-size: 13px; font-weight: 700">${b}</button>`).join("")}
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin: 12px 0 2px">
      <span style="font-size: 14px; color: ${MUTED}"><b style="color: ${INK}">${messItems.length} veg dishes</b> of 231</span>
      <div role="group" aria-label="Diet" style="display: flex; height: 40px; padding: 3px; border-radius: 999px; background: #F2F5F1; box-sizing: border-box">${["Veg", "All"].map((l, i) => `<button type="button" aria-pressed="${i === 0}" style="min-width: 54px; border: 0; border-radius: 999px; background: ${i === 0 ? "#FFFFFF" : "transparent"}; box-shadow: ${i === 0 ? "0 1px 3px rgba(0,0,0,.12)" : "none"}; color: ${INK}; font-size: 14px; font-weight: 600">${l}</button>`).join("")}</div>
    </div>
    ${messItems.slice(0, 9).map(menuRow).join("")}
  `)}`);

// 4 · Mess "now" card: big type for reading on the move.
const meals = [["Breakfast", "7:30–9:30", "Poha, boiled egg, bread butter, tea", "done"], ["Lunch", "12:30–2:30", "Rajma, jeera rice, aloo gobi, roti, salad", "now"], ["Snacks", "5:00–6:00", "", "next"], ["Dinner", "8:00–9:30", "", "later"]];
const messNow = frame(`
  ${band(`<div style="display: flex; align-items: center; justify-content: space-between">${logo}<span style="font-size: 13px; color: ${ON_DECK}">Thursday</span></div>
    <div style="margin-top: 16px">${eyebrow("Mess · serving now", ON_DECK)}</div>
    <h1 style="margin: 4px 0 0; font-family: ${SERIF}; font-size: 40px; line-height: 1; font-weight: 400">Lunch</h1>
    <p style="margin: 10px 0 0; font-size: 21px; line-height: 1.3">Rajma, jeera rice, aloo gobi, roti, salad</p>
    <p style="margin: 8px 0 0; font-size: 14px; color: ${ON_DECK}">Till 2:30 · ₹70 day scholars · free for hostellers</p>`, "14px 20px 22px")}
  ${sheet(`
    <div style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; background: ${MINT}">
      <div style="flex: 1; min-width: 0; font-size: 13px; color: ${MINT_INK}">Added by a student at 12:10 · <b>1 of 3</b> votes to correct</div>
      <button type="button" style="flex-shrink: 0; height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid ${MINT_INK}; background: transparent; color: ${MINT_INK}; font-size: 14px; font-weight: 700">Not correct</button>
    </div>
    <h2 style="margin: 18px 0 4px; font-family: ${SERIF}; font-size: 20px; font-weight: 400">Rest of today</h2>
    ${meals.filter((m) => m[3] !== "now").map(([meal, time, dishes, state]) => `
      <div style="display: flex; align-items: center; gap: 12px; min-height: 64px; border-bottom: 1px solid ${LINE}; opacity: ${state === "done" ? 0.6 : 1}">
        <div style="width: 74px; flex-shrink: 0"><div style="font-weight: 600">${meal}</div><div style="font-size: 12px; color: ${MUTED}">${time}</div></div>
        <div style="flex: 1; min-width: 0; font-size: 14px; color: ${dishes ? INK : MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${dishes || "Not added yet"}</div>
        ${dishes ? "" : `<button type="button" style="flex-shrink: 0; height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${GREEN}; font-size: 14px; font-weight: 700">+ Add</button>`}
      </div>`).join("")}
    <p style="margin: 14px 0 0; font-size: 13px; color: ${MUTED}">Menus reset every morning. Three "not correct" votes swap in the most common correction.</p>
    <h2 style="margin: 20px 0 8px; font-family: ${SERIF}; font-size: 20px; font-weight: 400">Not feeling rajma?</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">
      ${STALLS.filter((x) => x.open).map((x) => `<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; border-radius: 16px; background: ${x.tint}; color: inherit; text-decoration: none">${tile(tileName(x.name), 36, "#FFFFFF")}<span style="font-size: 13px; font-weight: 600; white-space: nowrap">${x.name}</span><span style="font-size: 11px; color: #1F6B43; font-weight: 600">${x.queue}</span></a>`).join("")}
    </div>
  `)}`, { tabItems: [["menu", "Menu"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]], activeTab: "mess" });

// 5 · Pickup pass: one glance tells you where, when and how much.
const progress = (step) => `
    <div style="margin-top: 12px">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px">${[0, 1, 2].map((i) => `<span style="height: 6px; border-radius: 999px; background: ${i <= step ? GREEN : "#E1E7E1"}"></span>`).join("")}</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 4px; font-size: 12px">${["Placed", "Preparing", "Ready"].map((l, i) => `<span style="color: ${i === step ? INK : MUTED}; font-weight: ${i === step ? 700 : 500}">${l}</span>`).join("")}</div>
    </div>`;
const passCard = (name, code, slot, ahead, lines, total, step) => `
  <div style="padding: 16px; border-radius: 20px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <div style="display: flex; align-items: center; gap: 12px">
      ${tile(tileName(name), 44, stall(name).tint, "12px")}
      <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 19px">${name}</div><div style="font-size: 13px; color: ${MUTED}">${lines}</div></div>
      <div style="text-align: right"><div style="font-size: 12px; color: ${MUTED}">Order</div><div style="font-family: ${SERIF}; font-size: 30px; line-height: 1">#${code}</div></div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 14px; padding-top: 12px; border-top: 1px dashed #DCE2DB">
      ${[["Pick up", slot], ["Ahead of you", ahead], ["Pay at counter", `₹${total}`]].map(([k, v]) => `<div><div style="font-size: 12px; color: ${MUTED}">${k}</div><div style="font-size: 20px; font-weight: 700">${v}</div></div>`).join("")}
    </div>${progress(step)}
  </div>`;
const roll = shelves["SnapEats"][0];
const momo = shelves["House of Chow"][0];
const pass = frame(`
  ${band(`<div style="display: flex; align-items: center; justify-content: space-between">${logo}<span style="font-size: 13px; color: ${ON_DECK}">Placed 12:58</span></div>
    <h1 style="margin: 14px 0 2px; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; font-weight: 400">You're set for 1:15</h1>
    <p style="margin: 0; font-size: 14px; color: ${ON_DECK}">Two counters. Show the order number and pay there.</p>`)}
  ${sheet(`
    ${passCard("SnapEats", "A42", "1:15", "1", `1 × ${roll.name}`, roll.price, 1)}
    ${passCard("House of Chow", "C17", "1:15", "0", `2 × ${momo.name}`, 2 * momo.price, 0)}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px">
      <a href="#" style="height: 48px; border-radius: 999px; border: 1px solid #DCE2DB; color: ${INK}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600">Add more</a>
      <a href="#" style="height: 48px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600">My orders</a>
    </div>
  `)}`, { activeTab: "orders" });

export const DESIGNS = [
  { title: "1 · Home shelves", head, body: home },
  { title: "2 · Add from the shelf", head, body: quickAdd },
  { title: "3 · Full menu by budget", head, body: fullMenu },
  { title: "4 · Mess right now", head, body: messNow },
  { title: "5 · Pickup pass", head, body: pass },
];
