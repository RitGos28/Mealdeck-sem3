// Variety 7: your day is the menu. Home is today's timeline (classes from the
// timetable, mess meals, night stalls); each free gap opens into "what fits
// this gap": stalls ranked by walk + queue + eating time, and a stall menu
// that hides what's too slow to make it back for the next class.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, tile, dishRow, chip, chipRow,
  STALLS, bagPill, bottomSheet, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Your day is the menu";
export const IDEA = "Home is your day's timetable; tap a free gap between classes and it shows only the stalls and dishes you can pick up and finish before your next class.";

const cat = (stall, name) => MENUS[stall].categories.find((c) => c.name === name);
const S = Object.fromEntries(STALLS.map((s) => [s.name, s]));
const TABS = [["menu", "Today"], ["stalls", "Stalls"], ["orders", "My orders"], ["account", "Account"]];
const eyebrow = (text, color = MUTED) => `<div style="font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: ${color}">${text}</div>`;

// ---------- timeline pieces ----------
const row = (time, inner, { dot = "#C9D2CB", line = true, now = false } = {}) => `
  <div style="display: flex; gap: 12px; position: relative">
    <div style="width: 44px; flex-shrink: 0; padding-top: 2px; font-size: 12px; font-weight: 600; color: ${now ? GREEN : MUTED}; text-align: right">${time}</div>
    <div style="width: 12px; flex-shrink: 0; position: relative; display: flex; justify-content: center">
      ${line ? `<div style="position: absolute; top: 6px; bottom: -6px; width: 2px; background: ${LINE}"></div>` : ""}
      <div style="position: relative; width: 10px; height: 10px; margin-top: 4px; border-radius: 999px; background: ${dot}; box-shadow: 0 0 0 3px #FFFFFF"></div>
    </div>
    <div style="flex: 1; min-width: 0; padding-bottom: 10px">${inner}</div>
  </div>`;
const classBlock = (name, room, past = false) => `
  <div style="padding: 8px 12px; border-radius: 12px; background: #F3F5F2; color: ${past ? MUTED : INK}">
    <div style="font-size: 14px; font-weight: 600">${name}</div><div style="font-size: 12px; color: ${MUTED}">${room}</div>
  </div>`;
const nowLine = (time) => `
  <div style="display: flex; align-items: center; gap: 8px; margin: -2px 0 8px 0">
    <span style="width: 44px; text-align: right; font-size: 11px; font-weight: 700; color: #B4532A">${time}</span>
    <span style="width: 12px; display: flex; justify-content: center"><span style="width: 8px; height: 8px; border-radius: 999px; background: #B4532A"></span></span>
    <span style="flex: 1; height: 2px; background: #B4532A; opacity: .5"></span><span style="font-size: 11px; font-weight: 700; color: #B4532A">NOW</span>
  </div>`;

// ---------- 1 · Today ----------
const gapCard = `
  <a href="#" style="display: block; padding: 12px 14px; border-radius: 16px; border: 2px solid ${GREEN}; background: #FFFFFF; text-decoration: none; color: inherit">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 19px">30 min free</span><span style="font-size: 12px; font-weight: 600; color: #1F6B43">2 stalls fit</span></div>
    <div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">SnapEats · 3 min walk · ~6 min wait</div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; height: 44px; margin-top: 10px; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 14px; font-weight: 600">Plan a bite for this gap ${chevron("right", 16)}</div>
  </a>`;
const mealLink = (meal, dishes, aside) => `
  <a href="#" style="display: block; padding: 8px 12px; border-radius: 12px; background: ${MINT}; text-decoration: none; color: ${INK}">
    <div style="display: flex; justify-content: space-between">${eyebrow(meal, MINT_INK)}<span style="font-size: 12px; color: #3E5A48">${aside}</span></div>
    <div style="margin-top: 2px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${dishes}</div>
  </a>`;
const today = frame(`
  ${band(`${logo}${bigTitle("Your Thursday", "4 classes · 2 gaps to eat in")}`)}
  ${sheet(`
    ${row("8:00", mealLink("Mess breakfast · done", "Poha, boiled egg, bread butter, tea", "till 9:30"), { dot: "#9FC7AE" })}
    ${row("9:00", classBlock("Data Structures", "N-201 · till 10:30"), { dot: "#8A968F" })}
    ${nowLine("10:20")}
    ${row("10:30", gapCard, { dot: GREEN, now: true })}
    ${row("11:00", classBlock("Discrete Maths + DBMS lab", "N-305, then Lab 4 · till 1:00"), { dot: "#8A968F" })}
    ${row("1:00", mealLink("Lunch gap · 1 hr", "Mess: Rajma, jeera rice, aloo gobi · ₹70 / free", "or a stall"), { dot: "#9FC7AE" })}
    ${row("2:00", classBlock("Economics", "A-110 · till 3:30"), { dot: "#8A968F" })}
    ${row("6 pm", `<div style="padding: 8px 12px; border-radius: 12px; background: ${GREEN}; color: #FFFFFF; font-size: 13px"><b style="font-weight: 600">Night stalls open</b> <span style="color: ${ON_DECK}">· hostels · till 12</span></div>`, { dot: GREEN, line: false })}
  `, "padding-top: 16px")}`, { tabItems: TABS });

// ---------- 2 · Gap opened: what fits ----------
/** Bar across the 30-minute gap: walk there, wait, eat, walk back. */
const fitBar = (parts) => `
  <div aria-hidden="true" style="display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: #EEF1ED; margin-top: 8px">
    ${parts.map(([kind, min]) => {
      const bg = { walk: "repeating-linear-gradient(135deg, #C9D2CB 0 3px, #E6EAE5 3px 6px)", wait: "#D9B65E", eat: "#2F8A57", over: "#C0703A" }[kind];
      return `<span style="width: ${(min / 30) * 100}%; background: ${bg}"></span>`;
    }).join("")}
  </div>`;
const fitCard = (s, verdict, color, line, parts, dim = false) => `
  <a href="#" style="display: block; padding: 12px 14px; border-radius: 16px; border: 1px solid ${LINE}; margin-bottom: 8px; text-decoration: none; color: inherit; ${dim ? "background: #FAFBFA" : ""}">
    <div style="display: flex; align-items: center; gap: 12px">
      ${tile(s.name, 40, dim ? "#F1F2F0" : s.tint, "12px")}
      <div style="flex: 1; min-width: 0">
        <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 18px; color: ${dim ? MUTED : INK}">${s.name}</span><span style="font-size: 13px; font-weight: 700; color: ${color}">${verdict}</span></div>
        <div style="font-size: 13px; color: ${MUTED}">${line}</div>
      </div>
    </div>
    ${fitBar(parts)}
  </a>`;
const legend = `<div style="display: flex; gap: 14px; font-size: 12px; color: ${MUTED}; margin: 0 0 12px">${[["repeating-linear-gradient(135deg, #C9D2CB 0 3px, #E6EAE5 3px 6px)", "Walk"], ["#D9B65E", "Queue"], ["#2F8A57", "Time to eat"], ["#C0703A", "Late"]].map(([bg, l]) => `<span style="display: inline-flex; align-items: center; gap: 5px"><span style="width: 12px; height: 8px; border-radius: 3px; background: ${bg}"></span>${l}</span>`).join("")}</div>`;
const gap = frame(`
  ${band(`${backLink("Today")}${bigTitle("10:30 – 11:00", "From N-201 to N-305 · 30 minutes")}
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; color: ${ON_DECK}"><span>10:30 class ends</span><span>10:45</span><span>11:00 next class</span></div>`)}
  ${sheet(`
    ${legend}
    ${fitCard(S["SnapEats"], "Fits · 15 min to eat", "#1F6B43", "3 min walk · 1 in queue · ready 10:39", [["walk", 3], ["wait", 6], ["eat", 15], ["walk", 3]])}
    ${fitCard(S["House of Chow"], "Tight · 6 min", "#8A6A12", "8 min walk · no queue · ready 10:46", [["walk", 8], ["wait", 8], ["eat", 6], ["walk", 8]])}
    ${fitCard(S["Paid Mess"], "Won't fit", "#9A3412", "4 min walk · 9 in queue · ready 10:58", [["walk", 4], ["wait", 24], ["over", 2]], true)}
    <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px; border-radius: 16px; background: ${MINT}; text-decoration: none; color: ${MINT_INK}">
      <div style="flex: 1; font-size: 13px"><b style="font-weight: 600">Too short for a meal?</b> Pre-order Paid Mess for your 1:00 lunch gap instead.</div>${chevron()}
    </a>
    <p style="margin: 10px 0 0; font-size: 12px; color: ${MUTED}">Quench is paused right now. Walk times are from your class room.</p>
  `)}`, { tabItems: TABS });

// ---------- 3 · Stall menu filtered to the gap ----------
const snap = MENUS["SnapEats"];
const prep = (min) => `<span style="font-size: 12px; font-weight: 600; color: ${MINT_INK}; background: ${MINT}; padding: 2px 8px; border-radius: 999px">~${min} min</span>`;
const fastHeader = (name, count, min, open = false) => `
  <div style="display: flex; align-items: center; gap: 8px; min-height: 48px; border-bottom: 1px solid #EEF1ED">
    <span style="flex: 1; font-size: 15px; font-weight: 600">${name}</span>${prep(min)}<span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: ${MUTED}">${count}${chevron(open ? "down" : "right")}</span>
  </div>`;
const chai = cat("SnapEats", "Chai Nagri");
const sand = cat("SnapEats", "Sandwiches");
const menuFit = frame(`
  ${band(`${backLink("10:30 gap")}${bigTitle("SnapEats", "Pick up 10:30–10:45 · back in N-305 by 11")}`)}
  ${sheet(`
    ${chipRow(`${chip("Fits my gap · 58", { on: true })}${chip(`All ${snap.count}`)}${chip("Veg")}`, "margin-bottom: 6px")}
    ${fastHeader(chai.name, chai.count, 3, true)}
    ${dishRow(chai.items[3], { qty: 1 })}
    ${dishRow(chai.items[0])}
    ${fastHeader(sand.name, sand.count, 6, true)}
    ${dishRow(sand.items[2])}
    ${fastHeader("Burgers", cat("SnapEats", "Burgers").count, 7)}
    ${fastHeader("Veg Kathi Rolls", cat("SnapEats", "Veg Kathi Rolls").count, 8)}
    <div style="margin-top: 14px; padding: 10px 14px 4px; border-radius: 14px; background: #F5F7F4">
      <div style="display: flex; justify-content: space-between; align-items: baseline">${eyebrow("Too slow for this gap")}<span style="font-size: 12px; color: ${MUTED}">86 dishes</span></div>
      <div style="font-size: 13px; color: ${MUTED}; margin-top: 2px">Dil Se Tandoori ~20 min · Indian Combos ~15 min · 4 more</div>
      <a href="#" style="display: flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">Save these for the 1:00 gap ${chevron("right", 16)}</a>
    </div>
  `)}
  ${bagPill(1, chai.items[3].price)}`, { tabItems: TABS });

// ---------- 4 · Bag with slots laid on the timetable ----------
const slot = (time, note, state) => {
  const on = state === "on", off = state === "off";
  return `<button type="button" ${off ? "disabled" : ""} aria-pressed="${on}" style="flex: 1; min-width: 0; height: 60px; border-radius: 14px; border: ${on ? `2px solid ${GREEN}` : `1px solid ${LINE}`}; background: ${on ? MINT : off ? "#F5F7F4" : "#FFFFFF"}; color: ${off ? "#8A968F" : INK}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 0">
    <span style="font-size: 14px; font-weight: 700">${time}</span><span style="font-size: 11px; font-weight: 600; color: ${on ? MINT_INK : MUTED}">${note}</span></button>`;
};
const paneer = sand.items[2];
const bag = frame(`
  ${band(`${backLink("10:30 gap")}${bigTitle("SnapEats")}`)}
  ${sheet(`${chipRow(`${chip("Fits my gap · 58", { on: true })}${chip(`All ${snap.count}`)}${chip("Veg")}`, "margin-bottom: 6px")}${fastHeader(chai.name, chai.count, 3, true)}${dishRow(chai.items[3], { qty: 1 })}`)}`, {
  tabItems: TABS,
  overlay: bottomSheet(`
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 24px">Your bag</span><span style="font-size: 13px; color: ${MUTED}">SnapEats · 2 items</span></div>
    ${dishRow(chai.items[3], { qty: 1, showTile: false })}
    ${dishRow(paneer, { qty: 1, showTile: false })}
    <div style="margin: 16px 0 8px">${eyebrow("Pick-up slot · laid on your day")}</div>
    <div style="display: flex; gap: 6px">
      ${slot("10:15", "In class", "off")}${slot("10:30", "Your gap", "on")}${slot("10:45", "Tight", "")}${slot("1:00", "Lunch gap", "")}
    </div>
    <p style="margin: 10px 0 0; font-size: 13px; color: ${MUTED}">Leave N-201 at 10:30, collect by 10:42, 15 min to eat, at N-305 by 11. Pay at the counter.</p>
    <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 16px; font-weight: 600"><span>Total</span><span>₹${chai.items[3].price + paneer.price}</span></div>
    <button type="button" style="width: 100%; margin-top: 12px; height: 52px; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 16px; font-weight: 600">Place pre-order for 10:30</button>`, "58%"),
});

// ---------- 5 · Evening: classes are done, the timeline hands over to the hostel ----------
const nightRow = (name, where, dist, q, picks) => `
  <a href="#" style="display: block; padding: 10px 12px; border-radius: 14px; border: 1px solid ${LINE}; margin-bottom: 8px; text-decoration: none; color: inherit">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 15px; font-weight: 600">${name}</span><span style="font-size: 12px; font-weight: 600; color: #1F6B43">${dist}</span></div>
    <div style="font-size: 12px; color: ${MUTED}">${where} · ${q}</div>
    <div style="margin-top: 4px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${picks}</div>
  </a>`;
const evening = frame(`
  ${band(`${logo}${bigTitle("Evening, Aanya", "Classes done · you're in B Block hostel")}`)}
  ${sheet(`
    ${row("10:30", `<div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: #F3F5F2; font-size: 13px; color: ${MUTED}"><span style="color: #1F6B43">✓</span> Picked up at SnapEats · ₹119</div>`, { dot: "#9FC7AE" })}
    ${row("1:00", `<div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: #F3F5F2; font-size: 13px; color: ${MUTED}"><span style="color: #1F6B43">✓</span> Mess lunch</div>`, { dot: "#9FC7AE" })}
    ${row("7:30", mealLink("Mess dinner · till 9:30", "Dal makhani, kadhai paneer, roti, kheer", "added 7:41"), { dot: "#9FC7AE" })}
    ${nowLine("9:50")}
    ${row("Till 12", `
      <div style="margin-bottom: 8px">${eyebrow("Night stalls · nearest first", GREEN)}</div>
      ${nightRow("Night Stall B Block", "Your hostel, ground floor", "1 min", "no queue", "Masala Maggi ₹50 · Bread Omelette ₹60")}
      ${nightRow("Night Stall A Block", "Boys' hostel A", "4 min", "2 in queue", "Aloo Parantha ₹50 · Cold Coffee ₹60")}
      <div style="font-size: 12px; color: ${MUTED}">SnapEats last orders 9:45 · closed for today</div>`, { dot: GREEN, now: true })}
    ${row("Fri", `<a href="#" style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 12px; border-radius: 12px; border: 1px dashed #C9D2CB; text-decoration: none; color: ${INK}"><div style="flex: 1; font-size: 13px"><b style="font-weight: 600">Tomorrow</b> <span style="color: ${MUTED}">· first class 9:00 · gaps at 10:30 and 1:00</span></div>${chevron("right", 16)}</a>`, { line: false })}
  `, "padding-top: 16px")}`, { tabItems: TABS });

export const DESIGNS = [
  { title: "1 · Today: your timetable", head, body: today },
  { title: "2 · What fits this gap", head, body: gap },
  { title: "3 · Menu trimmed to the gap", head, body: menuFit },
  { title: "4 · Pick-up slot on your day", head, body: bag },
  { title: "5 · Evening hands over to hostels", head, body: evening },
];
