// Variety 12: the user's picks from the others, combined. Default stalls
// home with a "By stall · By craving" switch, the menu sliced by budget
// (3.3), "Deal me a dish" as an optional minigame (#4), report sold out
// (9.4), the campus walk at checkout (#8), a receipt toast right after
// placing (11.5) and the Food passport on the profile (#5). Screens that
// came over unchanged are reused as-is, so they keep their own bottom tabs.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, searchBox, sheet, sectionTitle, tile, messCard, STALLS, statusDot,
  chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";
import { DESIGNS as V3 } from "./v3.js";
import { DESIGNS as V4 } from "./v4.js";
import { DESIGNS as V5 } from "./v5.js";
import { DESIGNS as V8 } from "./v8.js";
import { DESIGNS as V9 } from "./v9.js";
import { DESIGNS as R4 } from "../redesign4/designs.js";

export const TITLE = "Your picks, combined";
export const IDEA = "Stalls home by default with a switch to browse by craving, budget slices on menus, an optional Deal me a dish game, walk-timed checkout, a receipt toast and a Food passport on your profile.";

const upper = "font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase";

// "By stall · By craving" segmented switch at the top of the home sheet.
const viewSwitch = (craving) => `
  <div role="group" aria-label="Browse home" style="display: flex; padding: 3px; border-radius: 999px; background: #F0F3EF; margin-bottom: 14px">
    ${[["By stall", !craving], ["By craving", craving]].map(([label, on]) => `<button type="button" aria-pressed="${on}" style="flex: 1; height: 40px; border: 0; border-radius: 999px; background: ${on ? "#FFFFFF" : "transparent"}; color: ${on ? INK : MUTED}; font-size: 14px; font-weight: ${on ? 600 : 500}; ${on ? "box-shadow: 0 1px 3px rgba(0,0,0,.1)" : ""}">${label}</button>`).join("")}
  </div>`;

const homeBand = band(`${logo}${bigTitle("Good afternoon", "3 stalls open · mess lunch is up")}${searchBox()}`);

const againCard = (name, price) => `
  <div style="flex-shrink: 0; width: 196px; display: flex; align-items: center; gap: 10px; padding: 8px 6px 8px 8px; border-radius: 14px; border: 1px solid ${LINE}">
    ${tile(name, 36)}
    <div style="flex: 1; min-width: 0"><div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</div><div style="font-size: 12px; color: ${MUTED}">₹${price}</div></div>
    <button type="button" aria-label="Add ${name} again" style="width: 36px; height: 36px; flex-shrink: 0; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 18px">+</button>
  </div>`;

const stallRow = (s) => `
  <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; border: 1px solid ${LINE}; text-decoration: none; color: inherit">
    ${tile(s.name, 46, s.tint, "13px")}
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><span style="font-family: ${SERIF}; font-size: 17px">${s.name}</span>${statusDot(s)}</div>
      <div style="margin-top: 1px; font-size: 13px; color: ${MUTED}">${s.dishes} dishes · ${s.queue}</div>
    </div>
  </a>`;

// The optional minigame's way in: a small card, never in the way of ordering.
const miniCard = (name, rot, x, tint) => `<div aria-hidden="true" style="position: absolute; top: 8px; left: ${x}px; width: 44px; height: 60px; border-radius: 8px; background: #FFFFFF; border: 1px solid ${LINE}; transform: rotate(${rot}deg); box-shadow: 0 6px 12px -6px rgba(20,60,38,.5); display: flex; align-items: center; justify-content: center">${tile(name, 28, tint)}</div>`;
const dealCard = `
  <a href="#" style="position: relative; display: flex; align-items: center; gap: 14px; padding: 12px 14px 12px 128px; min-height: 80px; box-sizing: border-box; border-radius: 16px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; margin-bottom: 16px; overflow: hidden">
    ${miniCard("Veg Momos", -12, 14, "#F6EBD9")}${miniCard("Cold Coffee", 0, 38, MINT)}${miniCard("Paneer Roll", 12, 62, "#E6ECF5")}
    <div style="flex: 1; min-width: 0"><div style="font-family: ${SERIF}; font-size: 18px">Can't decide?</div><div style="font-size: 13px; color: ${ON_DECK}">Deal me a dish · a quick game</div></div>
    <span style="color: ${ON_DECK}">${chevron()}</span>
  </a>`;

const homeByStall = frame(`
  ${homeBand}
  ${sheet(`
    ${viewSwitch(false)}
    ${messCard()}
    ${dealCard}
    ${sectionTitle("Order again")}
    <div style="display: flex; gap: 8px; margin: 0 -20px 16px; padding: 0 20px; overflow: hidden">${againCard("Veg Kathi Roll", 99)}${againCard("Cold Coffee", 85)}</div>
    ${sectionTitle("Stalls", "4 on campus")}
    <div style="display: flex; flex-direction: column; gap: 8px">${STALLS.slice(0, 3).map(stallRow).join("")}</div>
  `)}`);

const CRAVINGS = [["Rolls", "#F6EBD9", "3 stalls · from ₹89"], ["Momos", MINT, "3 stalls · from ₹70"], ["Chinese", "#FBE7E1", "3 stalls · from ₹99"], ["Biryani", "#F3ECD8", "3 stalls · from ₹90"], ["Shakes", "#E6ECF5", "3 stalls · from ₹60"], ["Chai & coffee", "#EFE7DF", "4 stalls · from ₹10"], ["Sandwiches", "#EAF0E2", "3 stalls · from ₹69"], ["Dosa", "#F7E3DC", "1 stall · from ₹60"]];
const craving = ([name, bg, sub]) => `
  <a href="#" style="display: flex; flex-direction: column; justify-content: flex-end; height: 76px; padding: 10px 12px; border-radius: 16px; background: ${bg}; text-decoration: none; color: ${INK}; box-sizing: border-box">
    <span style="font-family: ${SERIF}; font-size: 18px; line-height: 1.1">${name}</span><span style="font-size: 12px; color: ${MUTED}">${sub}</span>
  </a>`;
const homeByCraving = frame(`
  ${homeBand}
  ${sheet(`
    ${viewSwitch(true)}
    ${sectionTitle("What are you craving?")}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px">${CRAVINGS.map(craving).join("")}</div>
    <p style="margin: 0; font-size: 13px; color: ${MUTED}">Tap one to see it from every stall, cheapest first. Your choice of view is remembered.</p>
  `)}`);

// Receipt toast, straight after placing the pre-order (payment is at the counter).
const snapRoll = MENUS["SnapEats"].categories.find((c) => c.name === "Veg Kathi Rolls").items[0];
const chowMomo = MENUS["House of Chow"].categories.flatMap((c) => c.items).find((i) => /momo/i.test(i.name));
const total = snapRoll.price + 2 * chowMomo.price;
const receiptLine = (qty, name, price) => `<div style="display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 2px 0"><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${qty}× ${name}</span><span style="font-variant-numeric: tabular-nums">₹${qty * price}</span></div>`;
const zigzag = `<div aria-hidden="true" style="height: 10px; background: linear-gradient(-45deg, transparent 6px, #FFFDF7 6px) 0 0 / 12px 12px repeat-x, linear-gradient(45deg, transparent 6px, #FFFDF7 6px) 0 0 / 12px 12px repeat-x"></div>`;
const toast = `
  <div role="status" aria-live="polite" style="position: absolute; left: 16px; right: 16px; top: 16px; z-index: 9; filter: drop-shadow(0 18px 28px rgba(11,31,20,.35))">
    <div style="background: #FFFDF7; border-radius: 16px 16px 0 0; padding: 14px 16px 10px; font-family: 'Courier New', ui-monospace, monospace; color: ${INK}">
      <div style="display: flex; align-items: center; justify-content: space-between"><span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 15px; color: ${GREEN}">✓ Pre-order placed</span><button type="button" aria-label="Dismiss" style="width: 32px; height: 32px; border: 0; background: transparent; font-size: 18px; color: ${MUTED}">×</button></div>
      <div style="${upper}; font-family: Inter, sans-serif; color: ${MUTED}; margin-top: 8px">SnapEats · #A42 · pick up 1:15</div>
      ${receiptLine(1, snapRoll.name, snapRoll.price)}
      <div style="${upper}; font-family: Inter, sans-serif; color: ${MUTED}; margin-top: 8px">House of Chow · #C17 · pick up 1:15</div>
      ${receiptLine(2, chowMomo.name, chowMomo.price)}
      <div style="border-top: 1px dashed #C9D1C2; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: 700"><span>TOTAL</span><span>₹${total}</span></div>
      <div style="font-family: Inter, sans-serif; font-size: 12px; color: ${MUTED}; margin-top: 4px">Pay at each counter when you pick up · closes in 6 s</div>
      <a href="#" style="display: inline-flex; align-items: center; min-height: 40px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">View full receipt ${chevron("right", 16)}</a>
    </div>
    ${zigzag}
  </div>`;
const liveCard = (stall, code, item, qty, ahead) => `
  <div style="padding: 14px; border-radius: 18px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 13px; color: ${MUTED}">${stall}</span><span style="font-size: 12px; font-weight: 600; color: #1F6B43">● Live</span></div>
    <div style="font-family: ${SERIF}; font-size: 24px; margin-top: 2px">Order ${code}</div>
    <div style="display: inline-flex; margin-top: 6px; padding: 6px 12px; border-radius: 999px; background: #F0F2EF; font-size: 13px; font-weight: 600">Placed</div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px"><span>${qty}× ${item}</span><span style="color: ${MUTED}">${ahead}</span></div>
  </div>`;
const ordersWithToast = frame(`
  ${band(`${logo}${bigTitle("Your orders", "Live updates · we'll show when it's ready")}`)}
  ${sheet(`
    <h2 style="margin: 0 0 10px; font-family: ${SERIF}; font-size: 22px; font-weight: 400">Today</h2>
    ${liveCard("SnapEats", "#A42", snapRoll.name, 1, "1 ahead of you")}
    ${liveCard("House of Chow", "#C17", chowMomo.name, 2, "You're next")}
  `)}`, { activeTab: "orders", overlay: toast });

// Profile with the Food passport on top.
const stamp = (name, date, rot, tint) => `<div style="width: 76px; height: 76px; border-radius: 999px; border: 2px dashed ${MINT_INK}; background: ${tint}; transform: rotate(${rot}deg); display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${MINT_INK}; text-align: center"><span style="font-family: ${SERIF}; font-size: 18px; line-height: 1">${name}</span><span style="font-size: 10px; font-weight: 600; margin-top: 3px">${date}</span></div>`;
const accountRow = (label, sub = "") => `<a href="#" style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 14px; border-top: 1px solid ${LINE}; text-decoration: none; color: ${INK}"><span><span style="display: block; font-size: 15px">${label}</span>${sub ? `<span style="font-size: 13px; color: ${MUTED}">${sub}</span>` : ""}</span><span style="color: ${MUTED}">${chevron()}</span></a>`;
const profile = frame(`
  ${band(`${logo}${bigTitle("Account", "student@bennett.edu.in")}`)}
  ${sheet(`
    <a href="#" style="display: block; padding: 14px; border-radius: 18px; background: ${MINT}; text-decoration: none; color: ${INK}; margin-bottom: 14px">
      <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="${upper}; color: ${MINT_INK}">Food passport</span><span style="font-size: 13px; font-weight: 600; color: ${MINT_INK}">Open ${chevron("right", 14)}</span></div>
      <div style="font-family: ${SERIF}; font-size: 24px; margin-top: 4px">31 of 777 dishes tried</div>
      <div aria-hidden="true" style="height: 8px; border-radius: 999px; background: #FFFFFF; margin-top: 8px; overflow: hidden"><div style="width: 4%; height: 100%; background: ${GREEN}"></div></div>
      <div style="display: flex; gap: 10px; margin-top: 12px">${stamp("VK", "Thu", -8, "#F6EBD9")}${stamp("SM", "Wed", 6, "#FFFFFF")}${stamp("CC", "Tue", -4, "#E6ECF5")}</div>
      <div style="font-size: 13px; color: #3E5A48; margin-top: 10px">Next to try: Paneer Tikka Roll at SnapEats · like your usual, ₹129</div>
    </a>
    <div style="border-radius: 16px; border: 1px solid ${LINE}; overflow: hidden">
      ${accountRow("My orders", "Live status and past pre-orders").replace("border-top: 1px solid", "border-top: 0 solid")}
      ${accountRow("Change password", "We'll email you a code")}
      ${accountRow("How we use your details")}
    </div>
    <button type="button" style="width: 100%; height: 50px; margin-top: 14px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 15px; font-weight: 600">Log out</button>
  `)}`, { activeTab: "account" });

const from = (design, title) => ({ title, head: design.head, body: design.body });

export const DESIGNS = [
  { title: "1 · Home, by stall (default)", head, body: homeByStall },
  { title: "2 · Home, by craving", head, body: homeByCraving },
  from(R4[3], "3 · A craving opened (from redesign4.4)"),
  from(V3[2], "4 · Stall menu by budget (from 3.3)"),
  from(V9[3], "5 · Report sold out (from 9.4)"),
  from(V4[1], "6 · Deal me a dish, the minigame (from 4.2)"),
  from(V4[2], "7 · Your hand (from 4.3)"),
  from(V8[3], "8 · Checkout timed to your walk (from 8.4)"),
  { title: "9 · Receipt toast after placing (from 11.5)", head, body: ordersWithToast },
  { title: "10 · Profile with Food passport", head, body: profile },
  from(V5[1], "11 · Passport stamp page (from 5.2)"),
  from(V5[4], "12 · New stamp after pickup (from 5.5)"),
];
