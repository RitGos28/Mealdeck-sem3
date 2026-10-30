// Variety 9: order as a table. Friends open a shared table, vote on where to
// eat, add to one bag, and one person picks up. Community signals (what's
// popular today, "sold out" reports) are counts only, never names. Friends,
// votes and counts are sample.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, sectionTitle, chip, chipRow, tile, vegMark, plusButton, stepper,
  categoryHeader, STALLS, statusDot, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Order as a table";
export const IDEA = "Start a table with friends, vote on where to eat, everyone adds to one shared bag, and one of you picks it all up.";

const TABS = [["menu", "Eat"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]];
const snap = MENUS["SnapEats"];
const chow = MENUS["House of Chow"];
const byName = Object.fromEntries(STALLS.map((s) => [s.name, s]));
const find = (menu, cat, i) => menu.categories.find((c) => c.name === cat).items[i];

// Sample friends: colour per person so their picks are easy to spot.
const PEOPLE = {
  Riya: { c: "#F6D9C9", ink: "#7A3A17" },
  Aarav: { c: "#D5E6F7", ink: "#1D4C80" },
  Kabir: { c: "#E7DDF5", ink: "#4E2F86" },
  You: { c: "#3C8A5E", ink: "#FFFFFF" },
};
const face = (who, size = 30, ring = "#FFFFFF") => `<span title="${who}" style="width: ${size}px; height: ${size}px; flex-shrink: 0; border-radius: 999px; background: ${PEOPLE[who].c}; color: ${PEOPLE[who].ink}; border: 2px solid ${ring}; display: inline-flex; align-items: center; justify-content: center; font-size: ${Math.round(size * 0.4)}px; font-weight: 700; box-sizing: border-box">${who === "You" ? "Me" : who[0]}</span>`;
const faces = (list, size = 30, ring = "#FFFFFF") => `<span style="display: inline-flex">${list.map((w, i) => `<span style="margin-left: ${i ? -8 : 0}px">${face(w, size, ring)}</span>`).join("")}</span>`;
const pillBtn = (text, { dark = true, full = false, h = 50 } = {}) => `<button type="button" style="${full ? "width: 100%;" : ""} height: ${h}px; padding: 0 18px; border-radius: 999px; border: ${dark ? "0" : "1px solid #DCE2DB"}; background: ${dark ? GREEN : "#FFFFFF"}; color: ${dark ? "#FFFFFF" : INK}; font-size: 15px; font-weight: 600">${text}</button>`;
const eyebrow = (t, color = MUTED) => `<div style="font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${color}">${t}</div>`;

// 1 · Home: eat solo or with your people
const tableCard = (host, plan, who, closes, joined = false) => `
  <div style="padding: 14px; border-radius: 18px; border: 1px solid ${LINE}; margin-bottom: 10px">
    <div style="display: flex; align-items: center; gap: 12px">
      ${faces(who, 34)}
      <div style="flex: 1; min-width: 0"><div style="font-size: 15px; font-weight: 700">${host}'s table</div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${plan}</div></div>
      ${joined ? `<span style="font-size: 13px; font-weight: 600; color: ${GREEN}">Joined</span>` : pillBtn("Join", { h: 44 })}
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: ${MUTED}">${closes}</div>
  </div>`;
const stallLine = (s, note) => `
  <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 56px; border-bottom: 1px solid #EEF1ED; text-decoration: none; color: inherit">
    ${tile(s.name, 40, s.tint, "12px")}
    <div style="flex: 1; min-width: 0"><div style="display: flex; justify-content: space-between; gap: 8px"><span style="font-size: 15px; font-weight: 600">${s.name}</span>${statusDot(s)}</div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${note}</div></div>
  </a>`;
const home = frame(`
  ${band(`${logo}${bigTitle("Lunch with who?", "3 stalls open · mess lunch is up")}`)}
  ${sheet(`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px">
      <button type="button" style="min-height: 92px; padding: 14px; border-radius: 18px; border: 0; background: ${GREEN}; color: #FFFFFF; text-align: left">
        <div style="font-family: ${SERIF}; font-size: 20px">Start a table</div><div style="margin-top: 4px; font-size: 13px; color: ${ON_DECK}">Friends add, one picks up</div>
      </button>
      <button type="button" style="min-height: 92px; padding: 14px; border-radius: 18px; border: 1px solid ${LINE}; background: #FFFFFF; color: ${INK}; text-align: left">
        <div style="font-family: ${SERIF}; font-size: 20px">Just me</div><div style="margin-top: 4px; font-size: 13px; color: ${MUTED}">Browse stalls solo</div>
      </button>
    </div>
    ${sectionTitle("Friends' tables", "invites only")}
    ${tableCard("Aarav", "Lunch run · SnapEats or House of Chow", ["Aarav", "Kabir"], "Closes 12:50 · Aarav picks up at 1:15")}
    ${sectionTitle("Stalls today", "counts, not names")}
    ${stallLine(byName["House of Chow"], "No queue · 38 orders since noon (sample)")}
    ${stallLine(byName["SnapEats"], "1 in queue · Cold coffee is today's top pick")}
    ${stallLine(byName["Paid Mess"], "3 in queue · Rajma rice selling fast")}
    ${stallLine(byName["Quench"], "Paused by the stall · back soon")}
  `)}`, { tabItems: TABS });

// 2 · Table lobby: who's in, where to, who collects
const voteRow = (name, voters, lead = false) => `
  <button type="button" aria-pressed="${voters.includes("You")}" style="width: 100%; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 12px; margin-bottom: 8px; border-radius: 16px; border: ${lead ? `2px solid ${GREEN}` : `1px solid ${LINE}`}; background: ${lead ? "#F6FAF7" : "#FFFFFF"}; color: ${INK}; text-align: left">
    ${tile(name, 40, byName[name].tint, "12px")}
    <span style="flex: 1; min-width: 0"><span style="display: block; font-size: 15px; font-weight: 700">${name}</span><span style="display: block; margin-top: 2px; font-size: 13px; color: ${MUTED}">${byName[name].queue}</span></span>
    ${voters.length ? faces(voters, 26) : ""}<span style="min-width: 22px; text-align: right; font-family: ${SERIF}; font-size: 20px; color: ${lead ? GREEN : MUTED}">${voters.length}</span>
  </button>`;
const lobby = frame(`
  ${band(`${backLink("Home")}<h1 style="margin: 10px 0 4px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">Aarav's table</h1>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px">
      <div style="display: flex; align-items: center; gap: 10px">${faces(["Aarav", "Kabir", "Riya", "You"], 34, GREEN)}<span style="font-size: 13px; color: ${ON_DECK}">4 in</span></div>
      <button type="button" style="height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.3); background: transparent; color: #FFFFFF; font-size: 14px; font-weight: 600">Invite · code K7Q2</button>
    </div>`, "14px 20px 18px")}
  ${sheet(`
    ${sectionTitle("Where to?", "tap to vote")}
    ${voteRow("House of Chow", ["Aarav", "Riya", "You"], true)}
    ${voteRow("SnapEats", ["Kabir"])}
    ${voteRow("Paid Mess", [])}
    <p style="margin: 2px 0 16px; font-size: 13px; color: ${MUTED}">Both food-court stalls can be in one table — Kabir can still add from SnapEats.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
      <div style="padding: 12px; border-radius: 14px; background: #F4F7F4">${eyebrow("Pick up")}<div style="margin-top: 4px; font-size: 17px; font-weight: 700">1:15 slot</div><div style="font-size: 13px; color: ${MUTED}">Aarav collects</div></div>
      <div style="padding: 12px; border-radius: 14px; background: #F4F7F4">${eyebrow("Table locks")}<div style="margin-top: 4px; font-size: 17px; font-weight: 700">12:50 pm</div><div style="font-size: 13px; color: ${MUTED}">in 14 min</div></div>
    </div>
    <div style="margin-top: 16px">${pillBtn(`Add my food · House of Chow`, { full: true })}</div>
  `)}`, { tabBar: false });

// 3 · Big menu, made small by the table: table picks first, sections folded
const momo = find(chow, "Momos (8 Pcs)", 0);
const noodle = find(chow, "Noodles", 1);
const potato = find(chow, "Veg Appetizers", 0);
const mojito = find(chow, "Mojitos", 0);
const pickRow = (item, who, qty = 0) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    ${faces(who, 28)}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(item.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${item.name}</span></div><div style="margin-top: 2px; font-size: 14px; color: ${MUTED}">${who.length > 1 ? who.length + " × " : ""}₹${item.price} · ${who.map((w) => (w === "You" ? "you" : w)).join(", ")}</div></div>
    ${qty ? stepper(qty) : plusButton(item.name)}
  </div>`;
const menu = frame(`
  ${band(`<div style="display: flex; align-items: center; justify-content: space-between">${backLink("Table")}<span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${ON_DECK}">${faces(["Aarav", "Kabir", "Riya", "You"], 26, GREEN)}locks 12:50</span></div>
    <h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">House of Chow</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">230 dishes · No queue · table's pick</p>`, "14px 20px 16px")}
  ${sheet(`
    ${chipRow([chip("House of Chow · 3", { on: true }), chip("SnapEats · 1"), chip("Search")].join(""), `margin: -4px -20px 12px; padding: 0 20px 10px; border-bottom: 1px solid ${LINE}`)}
    ${sectionTitle("On the table", "₹" + (momo.price * 2 + noodle.price + potato.price))}
    ${pickRow(momo, ["Aarav", "Riya"], 0)}
    ${pickRow(noodle, ["You"], 1)}
    ${pickRow(potato, ["Kabir"])}
    <div style="margin: 16px 0 6px">${eyebrow("Popular here today · sample counts")}</div>
    ${chipRow([`${mojito.name} · 21`, "Veg Kurkure Momos · 18", "Chilli Paneer · 12"].map((t) => chip(t)).join(""), "margin-bottom: 10px")}
    ${chow.categories.slice(0, 4).map((c) => categoryHeader(c.name, c.count)).join("")}
    <p style="margin: 8px 0 0; font-size: 13px; color: ${MUTED}">+ 21 more sections</p>
  `)}
  <a href="#" aria-label="Table bag" style="position: absolute; left: 16px; right: 16px; bottom: 16px; height: 56px; padding: 0 18px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 600; box-shadow: 0 12px 28px -10px rgba(20,60,38,.6); z-index: 6"><span>Table bag · 6 items</span><span style="display: flex; align-items: center; gap: 6px">₹${momo.price * 2 + noodle.price + potato.price + 85 + 99}${chevron("right", 16)}</span></a>`, { tabBar: false });

// 4 · Community signal: report a dish sold out (counted, never named)
const coffee = find(snap, "Cold Beverages", 0);
const report = frame(`
  ${band(`${backLink("Table")}<h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">SnapEats</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">144 dishes · 1 in queue</p>`, "14px 20px 16px")}
  ${sheet(`
    ${categoryHeader("Cold Beverages", 6, true)}
    <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED; opacity: .55">
      ${tile(coffee.name)}<div style="flex: 1"><div style="display: flex; align-items: center; gap: 6px">${vegMark(true)}<span style="font-size: 15px; font-weight: 500">${coffee.name}</span></div><div style="margin-top: 2px; font-size: 14px; color: #9A5B13">2 students say sold out</div></div>
    </div>
  `)}`, {
  tabBar: false,
  overlay: `
  <div style="position: absolute; inset: 0; background: rgba(11,31,20,.5); z-index: 8"></div>
  <div role="dialog" aria-modal="true" aria-label="Is Cold Coffee available?" style="position: absolute; left: 0; right: 0; bottom: 0; height: 520px; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 10px 20px 24px; box-sizing: border-box; z-index: 9">
    <div style="width: 40px; height: 4px; border-radius: 999px; background: #DCE2DB; margin: 0 auto 14px"></div>
    <div style="display: flex; gap: 12px; align-items: center">${tile(coffee.name, 48)}<div><div style="font-family: ${SERIF}; font-size: 23px">${coffee.name}</div><div style="font-size: 13px; color: ${MUTED}">SnapEats · ₹${coffee.price}</div></div></div>
    <div style="margin-top: 16px; padding: 12px 14px; border-radius: 14px; background: #FBF1E3; color: #7A4810; font-size: 14px; line-height: 1.4"><b>2 students</b> said this was sold out in the last 20 minutes. One more and it's greyed out for everyone until SnapEats confirms.</div>
    <div style="display: flex; gap: 6px; margin: 14px 0 6px">${[0, 1, 2].map((i) => `<span style="flex: 1; height: 6px; border-radius: 999px; background: ${i < 2 ? "#C9822B" : "#EDE4D6"}"></span>`).join("")}</div>
    <div style="font-size: 12px; color: ${MUTED}; margin-bottom: 16px">2 of 3 reports · resets every 2 hours</div>
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${pillBtn("I was just there — it's sold out", { full: true, h: 52 })}
      ${pillBtn("It's available, I just got one", { dark: false, full: true, h: 52 })}
      ${pillBtn("Add it anyway, the stall will tell me", { dark: false, full: true, h: 52 })}
    </div>
    <p style="margin: 12px 0 0; text-align: center; font-size: 12px; color: ${MUTED}">Reports are counted, never shown with your name.</p>
  </div>`,
});

// 5 · Table bag: grouped by person, one pickup, pay at counter
const fries = find(snap, "Crispy Snacks", 1);
const person = (who, items, note = "") => {
  const sum = items.reduce((t, [it, q]) => t + it.price * q, 0);
  return `<div style="padding: 10px 0; border-bottom: 1px solid ${LINE}">
    <div style="display: flex; align-items: center; gap: 10px">${face(who, 30)}<span style="flex: 1; font-size: 15px; font-weight: 700">${who === "You" ? "You" : who}${note ? ` <span style="font-weight: 500; font-size: 12px; color: ${GREEN}">${note}</span>` : ""}</span><span style="font-size: 15px; font-weight: 600">₹${sum}</span></div>
    ${items.map(([it, q, stall]) => `<div style="display: flex; align-items: center; gap: 6px; margin: 6px 0 0 40px; font-size: 14px; color: #3E4C44">${vegMark(it.veg)}<span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${q > 1 ? q + " × " : ""}${it.name}</span><span style="font-size: 12px; color: ${MUTED}">${stall}</span></div>`).join("")}
  </div>`;
};
const total = momo.price * 2 + noodle.price + potato.price + coffee.price + fries.price;
const bag = frame(`
  ${band(`${backLink("Table")}<h1 style="margin: 10px 0 2px; font-family: ${SERIF}; font-size: 28px; font-weight: 400">Table bag</h1><p style="margin: 0; font-size: 13px; color: ${ON_DECK}">4 people · 2 stalls · locks 12:50</p>`, "14px 20px 16px")}
  ${sheet(`
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: ${MINT}; color: ${MINT_INK}">
      ${face("Aarav", 40)}
      <div style="flex: 1; min-width: 0"><div style="font-size: 15px; font-weight: 700">Aarav picks up at 1:15</div><div style="font-size: 13px">Both food-court counters · one trip</div></div>
    </div>
    ${person("Aarav", [[momo, 1, "HC"]], "picks up")}
    ${person("Riya", [[momo, 1, "HC"]])}
    ${person("Kabir", [[potato, 1, "HC"], [coffee, 1, "SE"]])}
    ${person("You", [[noodle, 1, "HC"], [fries, 1, "SE"]])}
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 16px; font-weight: 700"><span>Table total</span><span>₹${total}</span></div>
    <p style="margin: 4px 0 14px; font-size: 13px; color: ${MUTED}">Aarav pays at the counter; each share is shown so you can settle up. Only people at this table see who ordered what.</p>
    ${pillBtn("Ready — tell Aarav I'm in", { full: true, h: 52 })}
  `, "padding-bottom: 20px")}`, { tabBar: false });

export const DESIGNS = [
  { title: "1 · Solo or a table", head, body: home },
  { title: "2 · Table lobby and stall vote", head, body: lobby },
  { title: "3 · Menu with table picks", head, body: menu },
  { title: "4 · Report sold out", head, body: report },
  { title: "5 · Table bag by person", head, body: bag },
];
