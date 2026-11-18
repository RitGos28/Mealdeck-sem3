// Variety 10 · The deck. Stalls are a stack of cards you flick through (or
// fan out to pick one); a stall's menu is a card file where only one
// category card is pulled up at a time; dishes you add become a "hand".
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, chip, chipRow, tile, vegMark, chevron,
  STALLS, statusDot, bottomSheet, MESS_TODAY, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK,
} from "./kit.js";

export const TITLE = "Deal the deck";
export const IDEA = "Stalls are a deck of cards: flick to the next stall or fan them out, open one to flip through its menu one category card at a time, and the dishes you add collect as a hand.";

const chow = MENUS["House of Chow"];
const snap = MENUS["SnapEats"];
const cat = (menu, name) => menu.categories.find((c) => c.name === name);
const momos = cat(chow, "Momos (8 Pcs)");
const vegApp = cat(chow, "Veg Appetizers");
const coldBev = cat(snap, "Cold Beverages");
const stall = (name) => STALLS.find((s) => s.name === name);

const btn = (label, { dark = true, wide = true, aria = "" } = {}) => `<button type="button" ${aria ? `aria-label="${aria}"` : ""} style="${wide ? "width: 100%;" : "padding: 0 20px;"} height: 50px; border-radius: 999px; border: ${dark ? "0" : `1px solid ${GREEN}`}; background: ${dark ? GREEN : "#FFFFFF"}; color: ${dark ? "#FFFFFF" : GREEN}; font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px">${label}</button>`;
const roundBtn = (dir, aria) => `<button type="button" aria-label="${aria}" style="width: 48px; height: 48px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; display: flex; align-items: center; justify-content: center">${chevron(dir, 20)}</button>`;
const kicker = (t, color = MUTED) => `<div style="font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${color}">${t}</div>`;

// ---------- 1 · Deck home ----------
const popular = {
  SnapEats: [cat(snap, "Veg Kathi Rolls").items[1], coldBev.items[0], cat(snap, "Dimsums & Cigar Spring Rolls").items[4], cat(snap, "Street Flavours").items[1]],
};
const miniLine = (d) => `<div style="display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px dashed #E2E7E1; font-size: 14px">${vegMark(d.veg)}<span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${d.name}</span><span style="color: ${MUTED}">₹${d.price}</span></div>`;

const ghostCard = (s, offset) => `<div aria-hidden="true" style="position: absolute; top: ${offset * 26}px; left: ${offset * 10}px; right: ${offset * 10}px; height: 372px; border-radius: 22px; background: ${s.tint}; border: 1px solid ${LINE}; box-shadow: 0 6px 16px -10px rgba(20,60,38,.35); display: flex; align-items: flex-end; justify-content: space-between; padding: 0 18px 6px; box-sizing: border-box; font-size: 12px; font-weight: 600; color: ${MINT_INK}"><span>${s.name}</span><span style="font-weight: 500; color: ${MUTED}">${s.open ? s.queue : "Paused"}</span></div>`;

const deckTop = (s) => `
  <article aria-label="${s.name}, card 1 of 4" style="position: absolute; top: 0; left: 0; right: 0; height: 372px; border-radius: 22px; background: #FFFFFF; border: 1px solid ${LINE}; box-shadow: 0 18px 34px -18px rgba(20,60,38,.55); overflow: hidden; display: flex; flex-direction: column">
    <div style="background: ${s.tint}; padding: 16px 18px 14px; display: flex; gap: 14px; align-items: center">
      ${tile(s.name, 62, "#FFFFFF", "18px")}
      <div style="flex: 1; min-width: 0">
        <div style="font-family: ${SERIF}; font-size: 28px; line-height: 1.05">${s.name}</div>
        <div style="margin-top: 5px; display: flex; gap: 10px; align-items: center">${statusDot(s)}<span style="font-size: 13px; color: #3E5A48">${s.queue} · ${s.hours}</span></div>
      </div>
    </div>
    <div style="padding: 12px 18px 0; flex: 1">
      ${kicker("Your usuals here · order again")}
      ${popular.SnapEats.map(miniLine).join("")}
      <div style="margin-top: 8px; font-size: 13px; color: ${MUTED}">${s.tags}</div>
    </div>
    <div style="padding: 0 18px 16px">${btn(`Open menu · ${s.dishes} dishes`)}</div>
  </article>`;

const compactMess = `
  <a href="#" style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border-radius: 14px; background: ${MINT}; color: ${INK}; text-decoration: none; margin-bottom: 14px">
    <span style="font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: ${MINT_INK}; white-space: nowrap">Mess · ${MESS_TODAY.meal}</span>
    <span style="flex: 1; min-width: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${MESS_TODAY.dishes}</span><span style="color: ${MINT_INK}">${chevron()}</span>
  </a>`;

const TABS = { tabItems: [["stalls", "Deck"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]], activeTab: "stalls" };

const deckHome = frame(`
  ${band(`${logo}${bigTitle("Good afternoon", "3 stalls open · flick the deck to browse")}`)}
  ${sheet(`
    ${compactMess}
    <div style="position: relative; height: 432px">
      ${ghostCard(stall("Quench"), 2)}${ghostCard(stall("Paid Mess"), 1)}
      ${deckTop(stall("SnapEats"))}
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px">
      ${roundBtn("left", "Previous stall")}
      <div style="text-align: center">
        <div style="display: flex; gap: 6px; justify-content: center">${STALLS.map((s, i) => `<span style="width: ${i === 0 ? 18 : 7}px; height: 7px; border-radius: 999px; background: ${i === 0 ? GREEN : "#CBD5CC"}"></span>`).join("")}</div>
        <div style="margin-top: 6px; font-size: 12px; color: ${MUTED}">Swipe, or hold to fan out</div>
      </div>
      ${roundBtn("right", "Next stall")}
    </div>
  `)}`, TABS);

// ---------- 2 · Fan out ----------
const fanCard = (s, i) => {
  const angle = [-10, -3.3, 3.3, 10][i];
  const abbr = s.name.replace(/[^A-Z]/g, "");
  const lift = s.name === "House of Chow" ? -26 : 0;
  const dim = !s.open;
  return `
  <button type="button" aria-label="${s.name}, ${s.status}, ${s.queue}" ${s.name === "House of Chow" ? 'aria-pressed="true"' : ""} style="position: absolute; left: 50%; bottom: 0; width: 118px; height: 186px; margin-left: -59px; transform-origin: 50% 400%; transform: rotate(${angle}deg) translateY(${lift}px); border-radius: 16px; border: ${s.name === "House of Chow" ? `2px solid ${GREEN}` : `1px solid ${LINE}`}; background: #FFFFFF; padding: 0; text-align: left; box-shadow: 0 14px 26px -14px rgba(20,60,38,.55); overflow: hidden; color: ${dim ? MUTED : INK}; z-index: ${s.name === "House of Chow" ? 10 : i + 1}">
    <div style="height: 100%; display: flex; flex-direction: column; background: linear-gradient(${s.tint} 0 58%, #FFFFFF 58%)">
      <div style="padding: 10px 10px 0; font-family: ${SERIF}; font-size: 16px; color: ${MINT_INK}; line-height: 1">${abbr}</div>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center"><span style="width: 50px; height: 50px; border-radius: 999px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: 19px; color: ${MINT_INK}">${abbr}</span></div>
      <div style="padding: 8px 10px 10px; background: #FFFFFF">
        <div style="font-family: ${SERIF}; font-size: 14px; color: ${INK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${s.name}</div>
        <div style="margin-top: 2px; font-size: 11px; color: ${MUTED}">${s.open ? s.queue : "Paused"}</div>
      </div>
    </div>
  </button>`;
};

const fanned = frame(`
  ${band(`${logo}${bigTitle("Pick a stall", "Holding the deck fans out all 4")}`)}
  ${sheet(`
    <div style="position: relative; height: 270px; margin: 6px -20px 0">${STALLS.map(fanCard).join("")}</div>
    <div style="margin-top: 26px; padding: 16px; border-radius: 18px; border: 1px solid ${LINE}">
      <div style="display: flex; justify-content: space-between; align-items: center"><span style="font-family: ${SERIF}; font-size: 24px">House of Chow</span>${statusDot(stall("House of Chow"))}</div>
      <div style="margin-top: 4px; font-size: 14px; color: ${MUTED}">No queue · ${chow.count} dishes · open till 9 pm</div>
      <div style="margin-top: 4px; font-size: 13px; color: #8A968F">${stall("House of Chow").tags}</div>
      <div style="display: flex; gap: 8px; margin-top: 14px">${btn("Open menu")}<span style="flex-shrink: 0">${btn("Order again", { dark: false, wide: false })}</span></div>
    </div>
    <p style="margin: 12px 0 0; font-size: 13px; color: ${MUTED}; text-align: center">Quench is paused right now · its card is greyed</p>
  `)}`, TABS);

// ---------- 3 · Menu as a card file ----------
const strip = (c, i, z) => `
  <button type="button" aria-label="${c.name}, ${c.count} dishes" style="position: relative; z-index: ${z}; width: 100%; height: 52px; margin-top: -8px; padding: 0 16px 8px; box-sizing: border-box; border-radius: 16px 16px 0 0; border: 1px solid ${LINE}; border-bottom: 0; background: ${["#F4F7F3", "#EEF3EE", "#E8EFE9"][i % 3]}; display: flex; align-items: center; justify-content: space-between; text-align: left; box-shadow: 0 -4px 10px -8px rgba(20,60,38,.4)">
    <span style="font-size: 15px; font-weight: 600; color: ${INK}">${c.name}</span><span style="font-size: 13px; color: ${MUTED}">${c.count}</span>
  </button>`;

const cardDish = (d, qty = 0) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid #EEF1ED">
    ${tile(d.name, 40)}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(d.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${d.name}</span></div><div style="margin-top: 1px; font-size: 14px; color: ${MUTED}">₹${d.price}</div></div>
    ${qty ? `<span style="display: flex; align-items: center; height: 44px; border-radius: 999px; border: 1px solid ${GREEN}; color: ${GREEN}"><button type="button" aria-label="Remove one ${d.name}" style="width: 36px; height: 44px; border: 0; background: none; color: inherit; font-size: 18px">−</button><span style="font-size: 14px; font-weight: 600">${qty}</span><button type="button" aria-label="Add one more ${d.name}" style="width: 36px; height: 44px; border: 0; background: none; color: inherit; font-size: 18px">+</button></span>` : `<button type="button" aria-label="Add ${d.name}" style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px; color: ${INK}">+</button>`}
  </div>`;

const handBtn = (count, total) => `
  <button type="button" aria-label="Your hand, ${count} dishes, ₹${total}" style="position: absolute; right: 16px; bottom: 84px; height: 58px; padding: 0 18px 0 12px; border-radius: 999px; border: 0; background: ${GREEN}; color: #FFFFFF; display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6); z-index: 6">
    <span aria-hidden="true" style="position: relative; width: 38px; height: 34px">${[-14, 0, 14].slice(0, count).map((a, i) => `<span style="position: absolute; left: ${8 + i * 4}px; top: 2px; width: 20px; height: 28px; border-radius: 4px; background: ${["#F6EBD9", "#FFFFFF", "#E3EFE6"][i]}; border: 1px solid rgba(0,0,0,.15); transform: rotate(${a}deg); transform-origin: 50% 100%"></span>`).join("")}</span>
    Your hand · ${count} · ₹${total}
  </button>`;

const handTotal = momos.items[1].price + vegApp.items[3].price + coldBev.items[0].price;

const menuInner = `
  ${band(`${backLink("Deck")}${bigTitle("House of Chow", `No queue · ${chow.count} dishes in ${chow.categories.length} category cards`)}`)}
  ${sheet(`
    ${chipRow([chip("All", { on: true }), chip("Veg"), chip("Food"), chip("Drinks"), chip("Price ↑")].join(""), "margin: 0 -20px 18px; padding: 0 20px")}
    <div style="padding-top: 8px">
      ${chow.categories.slice(0, 3).map((c, i) => strip(c, i, i + 1)).join("")}
      <section aria-label="${momos.name}" style="position: relative; z-index: 10; margin-top: -8px; padding: 12px 16px 6px; border-radius: 18px; background: #FFFFFF; border: 1.5px solid ${GREEN}; box-shadow: 0 -10px 22px -14px rgba(20,60,38,.55), 0 16px 26px -18px rgba(20,60,38,.5)">
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6px"><h2 style="margin: 0; font-family: ${SERIF}; font-size: 22px; font-weight: 400">${momos.name}</h2><span style="font-size: 13px; color: ${MUTED}">4 of 25</span></div>
        ${momos.items.map((d, i) => cardDish(d, i === 1 ? 1 : 0)).join("")}
      </section>
      <button type="button" style="width: 100%; min-height: 48px; margin-top: 10px; border: 1px dashed #C9D3CA; border-radius: 14px; background: #FFFFFF; font-size: 14px; color: ${MUTED}; display: flex; align-items: center; justify-content: center; gap: 6px">Chinese Rolls, Nutri Special + 19 more cards ${chevron("down", 16)}</button>
    </div>
  `, "position: relative; z-index: 0")}`;

const menuFile = frame(menuInner, { ...TABS, overlay: handBtn(3, handTotal) });

// ---------- 4 · Your hand (bag) ----------
const handCard = (d, qty, i) => `
  <div style="position: relative; width: 104px; flex-shrink: 0; height: 138px; border-radius: 14px; border: 1px solid ${LINE}; background: #FFFFFF; box-shadow: 0 10px 18px -14px rgba(20,60,38,.6); transform: rotate(${[-3, 2, -1][i % 3]}deg); padding: 10px; box-sizing: border-box; display: flex; flex-direction: column">
    <div style="display: flex; justify-content: space-between; align-items: center">${vegMark(d.veg)}<span style="font-size: 12px; font-weight: 700; color: ${GREEN}">×${qty}</span></div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center">${tile(d.name, 38)}</div>
    <div style="font-size: 12px; font-weight: 500; line-height: 1.25; height: 30px; overflow: hidden">${d.name}</div>
    <div style="font-size: 12px; color: ${MUTED}">₹${d.price}</div>
  </div>`;

const slotRow = (picked) => `<div role="radiogroup" aria-label="Pickup time" style="display: flex; gap: 6px; margin: 8px 0 10px">${["12:45", "1:00", "1:15", "1:30"].map((t) => `<button type="button" role="radio" aria-checked="${t === picked}" style="height: 44px; flex: 1; border-radius: 999px; border: 1px solid ${t === picked ? GREEN : "#DCE2DB"}; background: ${t === picked ? GREEN : "#FFFFFF"}; color: ${t === picked ? "#FFFFFF" : INK}; font-size: 14px; font-weight: 600">${t}</button>`).join("")}</div>`;

const handGroup = (name, queue, picked, cards) => `
  <div style="margin-top: 12px">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 18px">${name}</span><span style="font-size: 12px; color: ${MUTED}">${queue} · pick up at</span></div>
    ${slotRow(picked)}
    <div style="display: flex; gap: 10px; padding: 2px 2px 6px">${cards}</div>
  </div>`;

const hand = frame(menuInner, {
  ...TABS,
  overlay: bottomSheet(`
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 26px">Your hand</span><span style="font-size: 13px; color: ${MUTED}">2 stalls · 3 cards</span></div>
    ${handGroup("House of Chow", "No queue", "1:00", handCard(momos.items[1], 1, 0) + handCard(vegApp.items[3], 1, 1))}
    ${handGroup("SnapEats", "1 in queue", "1:15", handCard(coldBev.items[0], 1, 2) + `<button type="button" style="width: 104px; height: 138px; flex-shrink: 0; border-radius: 14px; border: 1.5px dashed #C9D3CA; background: #FFFFFF; color: ${MUTED}; font-size: 13px">+ Draw another</button>`)}
    <div style="display: flex; justify-content: space-between; margin: 12px 0 10px; font-size: 16px; font-weight: 600"><span>Total · pay at the counter</span><span>₹${handTotal}</span></div>
    ${btn("Play your hand · place pre-order")}`, "86%"),
});

// ---------- 5 · Mess card ----------
const meals = [
  ["Breakfast", "Poha, boiled egg, bread butter, tea"],
  ["Lunch", MESS_TODAY.dishes],
  ["Snacks", ""],
  ["Dinner", ""],
];
const messTabs = `<div role="tablist" aria-label="Meal" style="display: flex; gap: 4px; margin: 0 6px -1px; position: relative; z-index: 2">${meals.map(([m, d]) => {
  const on = m === "Lunch";
  return `<button type="button" role="tab" aria-selected="${on}" style="flex: 1; height: 46px; border-radius: 14px 14px 0 0; border: 1px solid ${on ? GREEN : LINE}; border-bottom: ${on ? "1px solid #FFFFFF" : `1px solid ${LINE}`}; background: ${on ? "#FFFFFF" : "#F2F5F1"}; color: ${on ? GREEN : MUTED}; font-size: 13px; font-weight: 600">${m}${d ? "" : `<span style="display: block; font-size: 10px; font-weight: 500">not added</span>`}</button>`;
}).join("")}</div>`;

const messCardBig = `
  <article style="position: relative; border-radius: 20px; border: 1px solid ${GREEN}; background: #FFFFFF; padding: 18px; box-shadow: 0 16px 30px -20px rgba(20,60,38,.6)">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><h2 style="margin: 0; font-family: ${SERIF}; font-size: 30px; font-weight: 400">Lunch</h2><span style="font-size: 12px; font-weight: 600; color: ${MINT_INK}; background: ${MINT}; padding: 4px 10px; border-radius: 999px">Today</span></div>
    <ul style="list-style: none; margin: 12px 0 0; padding: 0">${MESS_TODAY.dishes.split(", ").map((d) => `<li style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #E2E7E1; font-size: 16px">${vegMark(true)}${d[0].toUpperCase() + d.slice(1)}</li>`).join("")}</ul>
    <div style="margin-top: 12px; font-size: 14px">₹70 for day scholars · <b style="font-weight: 600; color: ${MINT_INK}">free for hostellers</b></div>
    <div style="margin-top: 4px; font-size: 12px; color: ${MUTED}">Added by a student at 12:10 pm · read-only, no ordering</div>
  </article>`;

const messScreen = frame(`
  ${band(`${backLink("Deck")}${bigTitle("Mess today", "Thursday · the menu students added")}`)}
  ${sheet(`
    ${messTabs}
    ${messCardBig}
    <div style="margin-top: 14px; padding: 14px; border-radius: 16px; background: #FBF6EC; border: 1px solid #EFE2C8">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px">
        <div style="font-size: 14px"><b style="font-weight: 600">Card looks wrong?</b><div style="font-size: 12px; color: ${MUTED}; margin-top: 2px">1 of 3 votes · then the most common fix replaces it</div></div>
        <div aria-hidden="true" style="display: flex; gap: 4px">${[1, 0, 0].map((v) => `<span style="width: 10px; height: 10px; border-radius: 999px; background: ${v ? "#9A5B13" : "#E6D6B8"}"></span>`).join("")}</div>
      </div>
      <button type="button" style="margin-top: 10px; width: 100%; height: 46px; border-radius: 999px; border: 1px solid #9A5B13; background: #FFFFFF; color: #7A4510; font-size: 14px; font-weight: 600">This isn't correct</button>
    </div>
  `)}`, { ...TABS, activeTab: "mess" });

export const DESIGNS = [
  { title: "1 · The stall deck", head, body: deckHome },
  { title: "2 · Fan out to pick", head, body: fanned },
  { title: "3 · Menu as a card file", head, body: menuFile },
  { title: "4 · Your hand (bag)", head, body: hand },
  { title: "5 · Mess card", head, body: messScreen },
];

