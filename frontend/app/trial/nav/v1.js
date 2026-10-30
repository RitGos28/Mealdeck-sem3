// Variety 1 (the one the user picked): a stalls home, and a stall page with
// pinned tabs for hopping between restaurants. Also the reference for how a
// variety is put together from kit.js and data.js.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, searchBox, sheet, sectionTitle, chip, chipRow, tile,
  dishRow, categoryHeader, messCard, MESS_TODAY, STALLS, statusDot, bagPill, bottomSheet, GREEN, SERIF, MUTED, LINE, MINT, MINT_INK,
} from "./kit.js";

export const TITLE = "Stalls home + tabs";
export const IDEA = "Home lists the stalls; each stall page has a pinned tab row to hop to another without going back.";

const snap = MENUS["SnapEats"];
const rolls = snap.categories.find((c) => c.name === "Veg Kathi Rolls");

const stallCard = (s) => `
  <a href="#" style="display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; border: 1px solid ${LINE}; text-decoration: none; color: inherit">
    ${tile(s.name, 52, s.tint, "14px")}
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><span style="font-family: ${SERIF}; font-size: 18px">${s.name}</span>${statusDot(s)}</div>
      <div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">${s.dishes} dishes · ${s.queue}</div>
      <div style="margin-top: 2px; font-size: 12px; color: #8A968F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${s.tags}</div>
    </div>
  </a>`;

const home = frame(`
  ${band(`${logo}${bigTitle("Good afternoon", "3 stalls open · mess lunch is up")}${searchBox()}`)}
  ${sheet(`
    ${messCard()}
    ${sectionTitle("Stalls", "4 on campus")}
    <div style="display: flex; flex-direction: column; gap: 8px">${STALLS.map(stallCard).join("")}</div>
  `)}`);

const stallTabs = (active) => chipRow(STALLS.map((s) => chip(s.name, { on: s.name === active })).join(""), `margin: -4px -20px 12px; padding: 0 20px 10px; border-bottom: 1px solid ${LINE}`);

const stallPage = frame(`
  ${band(`${backLink("All stalls")}${bigTitle("SnapEats", "Open till 10 pm · 1 in queue · 144 dishes")}`)}
  ${sheet(`
    ${stallTabs("SnapEats")}
    ${snap.categories.slice(0, 3).map((c) => categoryHeader(c.name, c.count)).join("")}
    ${categoryHeader(rolls.name, rolls.count, true)}
    ${rolls.items.slice(0, 3).map((item, i) => dishRow(item, { qty: i === 0 ? 1 : 0 })).join("")}
  `)}
  ${bagPill(1, rolls.items[0].price)}`);

const results = [];
for (const [stall, menu] of Object.entries(MENUS)) {
  for (const c of menu.categories) for (const item of c.items) if (/momo/i.test(item.name)) results.push({ ...item, stall });
}
const searchPage = frame(`
  ${band(`${logo}${searchBox("Search", "momos")}<p style="margin: 10px 0 0; font-size: 13px; color: #C3DDCB">${results.length} dishes at ${new Set(results.map((r) => r.stall)).size} stalls</p>`)}
  ${sheet(`
    ${chipRow(["All", "Veg", "Under ₹100"].map((c, i) => chip(c, { on: i === 0 })).join(""), "margin-bottom: 8px")}
    ${results.slice(0, 7).map((r) => dishRow(r, { sub: r.stall })).join("")}
  `)}`);

const messPage = frame(`
  ${band(`${backLink("Home")}${bigTitle("Mess today", "Thursday · menu added by students")}`)}
  ${sheet(`
    ${["Breakfast|Poha, boiled egg, bread butter, tea|8:02 am", `Lunch|${MESS_TODAY.dishes}|12:10 pm`, "Snacks|Not added yet|", "Dinner|Not added yet|"].map((line) => {
      const [meal, dishes, at] = line.split("|");
      const added = Boolean(at);
      return `<div style="padding: 12px 0; border-bottom: 1px solid ${LINE}">
        <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 19px">${meal}</span><span style="font-size: 12px; color: ${MUTED}">${meal === "Lunch" ? "₹70 day scholars" : ""}</span></div>
        <div style="margin-top: 4px; font-size: 14px; color: ${added ? "inherit" : MUTED}">${dishes}</div>
        <div style="margin-top: 6px; display: flex; gap: 14px; font-size: 13px; font-weight: 600; color: ${GREEN}">${added ? `<span style="font-weight: 400; color: ${MUTED}">Added by a student · ${at}</span><span>This isn't correct</span>` : "<span>+ Add today's menu</span>"}</div>
      </div>`;
    }).join("")}
    <p style="margin: 14px 0 0; padding: 12px 14px; border-radius: 14px; background: ${MINT}; color: ${MINT_INK}; font-size: 13px">Free for hostellers. Menus reset every morning; 3 "isn't correct" votes swap in the most common correction.</p>
  `)}`, { tabItems: [["menu", "Menu"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]], activeTab: "mess" });

const bag = frame(`
  ${band(`${backLink("All stalls")}${bigTitle("SnapEats")}`)}
  ${sheet(stallTabs("SnapEats"))}`, {
  overlay: bottomSheet(`
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 24px">Your bag</span><span style="font-size: 13px; color: ${MUTED}">2 stalls · 3 items</span></div>
    <p style="margin: 12px 0 4px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: ${MUTED}">SnapEats · pick up 1:15</p>
    ${dishRow(rolls.items[0], { qty: 1, showTile: false })}
    <p style="margin: 12px 0 4px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: ${MUTED}">House of Chow · pick up 1:15</p>
    ${dishRow(MENUS["House of Chow"].categories[0].items[0], { qty: 2, showTile: false })}
    <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 16px; font-weight: 600"><span>Total</span><span>₹${rolls.items[0].price + 2 * MENUS["House of Chow"].categories[0].items[0].price}</span></div>
    <div style="margin-top: 14px; height: 50px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 600">Place pre-order</div>`, "64%"),
});

export const DESIGNS = [
  { title: "1 · Stalls home", head, body: home },
  { title: "2 · Stall page with tabs", head, body: stallPage },
  { title: "3 · Search across stalls", head, body: searchPage },
  { title: "4 · Mess today", head, body: messPage },
  { title: "5 · Bag across two stalls", head, body: bag },
];
