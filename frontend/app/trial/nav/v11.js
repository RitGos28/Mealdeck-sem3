// Variety 11 · Pickup board + price list. Home is a live departure-style
// board of counters showing each stall's next free pickup slot; a stall's
// menu is a dense printed price list with a category scrubber on the edge;
// two stalls can be opened split-screen; the bag is a printed receipt.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, chip, chipRow, tile, vegMark, chevron,
  STALLS, MESS_TODAY, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Pickup board, price list";
export const IDEA = "Home is a live board showing when each stall can next have your food ready; tap one for a compact printed price list you jump through with a side scrubber, and your bag prints as a receipt.";

const snap = MENUS["SnapEats"];
const chow = MENUS["House of Chow"];
const cat = (menu, name) => menu.categories.find((c) => c.name === name);
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const TABS = { tabItems: [["stalls", "Board"], ["search", "Search"], ["orders", "My orders"], ["account", "Account"]], activeTab: "stalls" };

// Bag used across screens.
const sandwich = cat(snap, "Sandwiches").items[2];
const chai = cat(snap, "Chai Nagri").items[3];
const kurkure = cat(chow, "Momos (8 Pcs)").items[1];

// ---------- shared pieces ----------
const flap = (text, { amber = false, size = 20 } = {}) => `<span aria-label="${text}" style="display: inline-flex; gap: 2px">${[...text].map((ch) => ch === ":" ? `<span aria-hidden="true" style="width: 7px; text-align: center; font-family: ${MONO}; font-size: ${size - 2}px; font-weight: 700; color: #FFFFFF; line-height: ${size + 10}px">:</span>` : `<span aria-hidden="true" style="width: ${size}px; height: ${size + 10}px; border-radius: 4px; background: linear-gradient(#0E2A1B 0 49%, #08200F 49% 51%, #0B2416 51%); color: ${amber ? "#F3C27A" : "#FFFFFF"}; font-family: ${MONO}; font-size: ${size - 4}px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06)">${ch}</span>`).join("")}</span>`;

const ticket = (count, total, label = "Receipt") => `
  <a href="#" aria-label="${label}: ${count} items, ₹${total}" style="position: absolute; left: 20px; right: 20px; bottom: 84px; height: 54px; border-radius: 12px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 12px; padding: 0 18px; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6); z-index: 6; box-sizing: border-box">
    <span style="font-size: 15px; font-weight: 600">${label}</span>
    <span aria-hidden="true" style="flex: 1; border-left: 1.5px dashed rgba(255,255,255,.35); height: 30px"></span>
    <span style="font-family: ${MONO}; font-size: 15px">${count} items · ₹${total}</span>${chevron("right")}
  </a>`;

const priceRow = (d, qty = 0) => `
  <button type="button" aria-label="${qty ? `${d.name}, ${qty} in receipt, add one more` : `Add ${d.name}, ₹${d.price}`}" style="display: flex; align-items: center; gap: 8px; width: calc(100% + 16px); min-height: 44px; margin: 0 -8px; padding: 0 8px; border: 0; border-radius: 10px; background: ${qty ? MINT : "transparent"}; color: ${INK}; text-align: left; font-size: 15px; box-sizing: border-box">
    ${qty ? `<b style="font-family: ${MONO}; font-size: 14px; color: ${GREEN}">${qty}×</b>` : ""}${vegMark(d.veg)}
    <span style="flex: 0 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: ${qty ? 600 : 400}">${d.name}</span>
    <span aria-hidden="true" style="flex: 1; min-width: 14px; height: 0; border-bottom: 2px dotted #C3CCC4; margin-top: 8px"></span>
    <span style="font-family: ${MONO}; font-size: 14px; color: ${qty ? GREEN : INK}">${d.price}</span>
  </button>`;

const section = (c, qtys = {}) => `
  <section aria-label="${c.name}">
    <h2 style="display: flex; justify-content: space-between; align-items: baseline; margin: 14px 0 2px; padding-top: 10px; border-top: 1px solid ${LINE}; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${MINT_INK}">${c.name}<span style="font-weight: 500; letter-spacing: 0; text-transform: none; color: ${MUTED}">${c.count}</span></h2>
    ${c.items.map((d) => priceRow(d, qtys[d.name] || 0)).join("")}
    ${c.count > c.items.length ? `<button type="button" style="min-height: 44px; border: 0; background: none; padding: 0; font-size: 14px; font-weight: 600; color: ${GREEN}">+ ${c.count - c.items.length} more ${c.name.toLowerCase()}</button>` : ""}
  </section>`;

const SHORT = { "Hot Beverages": "Hot", "Chai Nagri": "Chai", Sandwiches: "Sand", Burgers: "Burg", "Dil Se Tandoori": "Tand", "Crispy Snacks": "Snck", "Soups (Winter Edition)": "Soup", "Dimsums & Cigar Spring Rolls": "Momo", "Street Flavours": "Strt", "Cold Beverages": "Cold", "Veg Kathi Rolls": "Roll", "Non Veg Kathi Rolls": "NV Rl", Continental: "Pasta", "Classic Indian Combos": "Cmbo" };
const RAIL_TOP = 14;
const RAIL_STEP = 36;
const rail = (active) => `
  <div role="slider" aria-label="Jump to category" aria-valuemin="1" aria-valuemax="${snap.categories.length}" aria-valuenow="${snap.categories.findIndex((c) => c.name === active) + 1}" aria-valuetext="${active}" tabindex="0" style="position: absolute; right: 6px; top: ${RAIL_TOP}px; width: 42px; padding: 4px 0; border-radius: 999px; background: #F2F5F1; display: flex; flex-direction: column; align-items: center; z-index: 3">
    ${snap.categories.map((c) => {
      const on = c.name === active;
      return `<span style="height: ${RAIL_STEP}px; width: 38px; display: flex; align-items: center; justify-content: center"><span style="${on ? `background: ${GREEN}; color: #FFFFFF; width: 38px; height: 38px; border-radius: 999px;` : `color: ${MUTED};`} display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: -.01em">${SHORT[c.name]}</span></span>`;
    }).join("")}
  </div>`;

const listBand = (title, sub) => band(`${backLink("Board")}${bigTitle(title, sub)}${chipRow([chip("All", { on: true, dark: true }), chip("Veg", { dark: true }), chip("Food", { dark: true }), chip("Drinks", { dark: true }), chip("Price ↑", { dark: true })].join(""), "margin: 14px -20px 0; padding: 0 20px")}`, "14px 20px 18px");

// ---------- 1 · Board home ----------
const boardRow = ({ name, sub, right, label, href = true }) => `
  <${href ? 'a href="#"' : "div"} style="display: flex; align-items: center; gap: 12px; min-height: 66px; padding: 8px 20px; border-top: 1px solid rgba(255,255,255,.1); color: #FFFFFF; text-decoration: none">
    <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 21px; line-height: 1.15">${name}</div><div style="margin-top: 2px; font-size: 13px; color: ${ON_DECK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${sub}</div></div>
    <div style="text-align: right; flex-shrink: 0">${right}<div style="margin-top: 3px; font-size: 11px; color: ${ON_DECK}">${label}</div></div>
  </${href ? "a" : "div"}>`;

const stallInfo = (n) => STALLS.find((s) => s.name === n);
const SLOTS = { SnapEats: "1:15", "House of Chow": "1:00", "Paid Mess": "1:30" };

const boardHome = frame(`
  ${band(`<div style="display: flex; justify-content: space-between; align-items: center">${logo}<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: ${ON_DECK}"><span style="width: 7px; height: 7px; border-radius: 999px; background: #7FD69B"></span>Live · 12:58 pm</span></div>${bigTitle("Pickup board", "Tap a counter to see its price list")}`, "14px 20px 14px")}
  <div style="display: flex; justify-content: space-between; padding: 4px 20px 6px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${ON_DECK}"><span>Counter</span><span>Ready by</span></div>
  ${boardRow({ name: "Mess · Lunch", sub: MESS_TODAY.dishes, right: `<span style="display: inline-flex; height: 30px; align-items: center; padding: 0 10px; border-radius: 6px; background: ${MINT}; color: ${MINT_INK}; font-size: 13px; font-weight: 700">Menu</span>`, label: "free for hostellers" })}
  ${["SnapEats", "House of Chow", "Paid Mess"].map((n) => {
    const s = stallInfo(n);
    return boardRow({ name: n, sub: `${s.queue} · ${s.dishes} dishes · ${s.hours.replace("Open ", "")}`, right: flap(SLOTS[n]), label: "next pickup slot" });
  }).join("")}
  ${boardRow({ name: "Quench", sub: "Shakes · juices · sodas · back soon", right: flap("PAUSED", { amber: true, size: 17 }), label: "not taking orders" })}
  ${sheet(`
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px"><h2 style="margin: 0; font-family: ${SERIF}; font-size: 20px; font-weight: 400">Order again</h2><span style="font-size: 13px; color: ${MUTED}">from your last 3 orders</span></div>
    ${priceRow({ ...kurkure, name: `${kurkure.name} · Chow` })}
    ${priceRow({ ...sandwich, name: `${sandwich.name} · Snap` })}
  `, "margin-top: 10px; padding-top: 16px")}`, TABS);

// ---------- 2 · Price list ----------
const qtys = { [sandwich.name]: 1, [chai.name]: 2 };
const bagSnapTotal = sandwich.price + 2 * chai.price;

const priceListInner = `
  ${listBand("SnapEats", "Ready by 1:15 · 1 in queue · 144 dishes")}
  ${sheet(`
    ${rail("Chai Nagri")}
    <div style="margin-top: -25px">${["Hot Beverages", "Chai Nagri", "Sandwiches", "Burgers"].map((n) => section(cat(snap, n), qtys)).join("")}</div>
  `, "position: relative; padding-right: 60px")}`;
const priceList = frame(priceListInner, { ...TABS, overlay: ticket(3, bagSnapTotal) });

// ---------- 3 · Scrubbing ----------
const rollIdx = snap.categories.findIndex((c) => c.name === "Veg Kathi Rolls");
const before = snap.categories.slice(0, rollIdx).reduce((n, c) => n + c.count, 0);
const rolls = cat(snap, "Veg Kathi Rolls");
const bubbleTop = RAIL_TOP + 4 + rollIdx * RAIL_STEP - 30;

const scrubbing = frame(`
  ${listBand("SnapEats", "Ready by 1:15 · 1 in queue · 144 dishes")}
  ${sheet(`
    ${rail("Veg Kathi Rolls")}
    <div aria-live="polite" style="position: absolute; right: 60px; top: ${bubbleTop}px; width: 220px; padding: 14px 16px; border-radius: 18px 18px 6px 18px; background: ${GREEN}; color: #FFFFFF; box-shadow: 0 16px 30px -12px rgba(20,60,38,.7); z-index: 4">
      <div style="font-family: ${SERIF}; font-size: 24px; line-height: 1.1">${rolls.name}</div>
      <div style="margin-top: 4px; font-size: 13px; color: ${ON_DECK}">${rolls.count} dishes · from ₹${Math.min(...rolls.items.map((d) => d.price))}</div>
      <div style="margin-top: 2px; font-family: ${MONO}; font-size: 12px; color: ${ON_DECK}">dish ${before + 1}–${before + rolls.count} of ${snap.count}</div>
    </div>
    <div style="margin-top: -25px; opacity: .5">${section(cat(snap, "Cold Beverages"))}</div>
    ${section(rolls)}
  `, "position: relative; padding-right: 60px")}`, { ...TABS, overlay: ticket(3, bagSnapTotal) });

// ---------- 4 · Split view ----------
const panelHead = (name, sub) => `
  <div style="display: flex; align-items: center; gap: 10px; padding-bottom: 6px">
    ${tile(name.replace(" of ", " "), 38, MINT, "12px")}
    <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 20px; line-height: 1.1">${name}</div><div style="font-size: 12px; color: ${MUTED}">${sub}</div></div>
    <button type="button" aria-label="Change ${name} to another stall" style="height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 13px; font-weight: 600; color: ${INK}; display: flex; align-items: center; gap: 4px">Swap ${chevron("down", 14)}</button>
  </div>`;

const panel = (inner, h) => `<div style="height: ${h}px; overflow: hidden; background: #FFFFFF; border-radius: 22px; margin: 0 8px; padding: 12px 16px 0; box-sizing: border-box">${inner}</div>`;

const split = frame(`
  ${band(`<div style="display: flex; align-items: center; justify-content: space-between">${backLink("Board")}<span style="font-size: 13px; color: ${ON_DECK}">Ordering for friends?</span></div><h1 style="margin: 8px 0 0; font-family: ${SERIF}; font-size: 26px; font-weight: 400">Two counters at once</h1>`, "14px 20px 14px")}
  ${panel(`${panelHead("House of Chow", "Ready 1:00 · no queue")}${chipRow(["Momos", "Noodles", "Rice", "Rolls"].map((c, i) => chip(c, { on: i === 0 })).join(""), "margin-bottom: 2px")}${cat(chow, "Momos (8 Pcs)").items.map((d) => priceRow(d, d.name === kurkure.name ? 1 : 0)).join("")}`, 316)}
  <div role="separator" aria-label="Drag to resize the two lists" aria-orientation="horizontal" tabindex="0" style="height: 28px; display: flex; align-items: center; justify-content: center"><span style="width: 56px; height: 5px; border-radius: 999px; background: rgba(255,255,255,.55)"></span></div>
  ${panel(`${panelHead("SnapEats", "Ready 1:15 · 1 in queue")}${chipRow(["Sandwiches", "Chai", "Rolls", "Cold"].map((c, i) => chip(c, { on: i === 0 })).join(""), "margin-bottom: 2px")}${cat(snap, "Sandwiches").items.map((d) => priceRow(d, d.name === sandwich.name ? 1 : 0)).join("")}`, 330)}`,
{ ...TABS, overlay: ticket(4, bagSnapTotal + kurkure.price) });

// ---------- 5 · Receipt ----------
const edge = (pos) => `<div aria-hidden="true" style="height: 10px; background: radial-gradient(circle at 6px ${pos === "top" ? "0" : "100%"}, transparent 6px, #FFFDF6 6.5px) 0 0 / 12px 10px repeat-x"></div>`;
const rLine = (qty, name, price) => `<div style="display: flex; gap: 6px; align-items: baseline; font-family: ${MONO}; font-size: 14px; padding: 4px 0"><span>${qty}×</span><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</span><span aria-hidden="true" style="flex: 1; min-width: 12px; border-bottom: 2px dotted #CFC8B4"></span><span>${price}</span></div>`;
const dash = `<div aria-hidden="true" style="border-top: 1.5px dashed #D8D0BA; margin: 10px 0"></div>`;
const stallHead = (name, slot) => `<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-family: ${MONO}; font-size: 13px; font-weight: 700; letter-spacing: .06em">${name.toUpperCase()}</span><button type="button" aria-label="Change ${name} pickup time, now ${slot}" style="height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid ${GREEN}; background: #FFFFFF; color: ${GREEN}; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px">Pick up ${slot} ${chevron("down", 14)}</button></div>`;

const total = bagSnapTotal + kurkure.price;
const receipt = frame(priceListInner, {
  ...TABS,
  overlay: `
  <div style="position: absolute; inset: 0; background: rgba(11,31,20,.55); z-index: 8"></div>
  <div role="dialog" aria-modal="true" aria-label="Your receipt" style="position: absolute; left: 22px; right: 22px; top: 110px; z-index: 9; filter: drop-shadow(0 20px 30px rgba(0,0,0,.35))">
    ${edge("top")}
    <div style="background: #FFFDF6; padding: 8px 20px 18px">
      <div style="text-align: center"><div style="font-family: ${SERIF}; font-size: 28px">MealDeck</div><div style="font-family: ${MONO}; font-size: 12px; color: ${MUTED}; letter-spacing: .06em">PRE-ORDER · THU 30 OCT</div></div>
      ${dash}
      ${stallHead("SnapEats", "1:15")}
      ${rLine(1, sandwich.name, sandwich.price)}${rLine(2, chai.name, 2 * chai.price)}
      ${dash}
      ${stallHead("House of Chow", "1:00")}
      ${rLine(1, kurkure.name, kurkure.price)}
      ${dash}
      <div style="display: flex; justify-content: space-between; align-items: baseline; font-family: ${MONO}"><span style="font-size: 14px; font-weight: 700; letter-spacing: .06em">TOTAL</span><span style="font-size: 26px; font-weight: 700">₹${total}</span></div>
      <p style="margin: 6px 0 14px; font-size: 13px; color: ${MUTED}; text-align: center">Pay at each counter when you pick up</p>
      <button type="button" style="width: 100%; height: 52px; border-radius: 999px; border: 0; background: ${GREEN}; color: #FFFFFF; font-size: 16px; font-weight: 600">Place pre-order</button>
      <button type="button" style="width: 100%; height: 44px; margin-top: 6px; border: 0; background: none; color: ${GREEN}; font-size: 14px; font-weight: 600">Keep adding</button>
    </div>
    ${edge("bottom")}
  </div>`,
});

export const DESIGNS = [
  { title: "1 · Live pickup board", head, body: boardHome },
  { title: "2 · Printed price list", head, body: priceList },
  { title: "3 · Scrub to a category", head, body: scrubbing },
  { title: "4 · Two counters split", head, body: split },
  { title: "5 · Receipt (bag)", head, body: receipt },
];
