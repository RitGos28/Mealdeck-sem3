// Variety 5: "Food passport". Every dish you pick up stamps your passport, so
// the 605 dishes on campus become a collection to work through: each stall is
// a passport page of category stamps, menus show what's new to you, and your
// usual order offers a "twist" from the same counter.
import { MENUS } from "./data.js";
import {
  head, frame, band, logo, bigTitle, backLink, sheet, sectionTitle, chip, chipRow, tile, vegMark,
  STALLS, statusDot, bagPill, bagIcon, bottomSheet, chevron, GREEN, SERIF, INK, MUTED, LINE, MINT, MINT_INK, ON_DECK,
} from "./kit.js";

export const TITLE = "Food passport";
export const IDEA = "Every dish you pick up stamps your campus food passport, so menus show what you haven't tried yet and your usual comes with a new twist to try.";

const TABS = { tabItems: [["menu", "Passport"], ["mess", "Mess"], ["orders", "My orders"], ["account", "Account"]] };
const INKS = { "SnapEats": "#1F6B43", "House of Chow": "#8A5A12", "Paid Mess": "#2B4C7E", "Quench": "#6B7570" };
const stallOf = (name) => STALLS.find((s) => s.name === name);
const cat = (stall, name) => MENUS[stall].categories.find((c) => c.name === name);
const item = (stall, category, name) => ({ ...cat(stall, category).items.find((i) => i.name === name), stall, category });
const upper = `font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase`;

const bagButton = (count = 0) => `<a href="#" aria-label="Bag, ${count} items" style="position: relative; width: 44px; height: 44px; border-radius: 999px; background: rgba(255,255,255,.12); color: #FFFFFF; display: flex; align-items: center; justify-content: center">${bagIcon(20)}${count ? `<span style="position: absolute; top: 4px; right: 4px; min-width: 16px; height: 16px; border-radius: 999px; background: #FFFFFF; color: ${GREEN}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">${count}</span>` : ""}</a>`;
const topRow = (left, count = 0) => `<div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px">${left}${bagButton(count)}</div>`;
const bar = (frac, { color = GREEN, track = "#E6EAE5", h = 6 } = {}) => `<div aria-hidden="true" style="height: ${h}px; border-radius: 999px; background: ${track}; overflow: hidden"><div style="width: ${Math.max(3, Math.round(frac * 100))}%; height: 100%; border-radius: 999px; background: ${color}"></div></div>`;

/** An ink stamp. Tried = coloured, rotated, double ring; not tried = dashed outline. */
function stamp(name, { tried = false, ink = GREEN, size = 64, rot = -8, note = "" } = {}) {
  if (!tried) {
    return `<div aria-hidden="true" style="width: ${size}px; height: ${size}px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; border: 2px dashed #CBD3CC; color: #A7B2AB; display: flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: ${Math.round(size * 0.32)}px">${name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}</div>`;
  }
  return `<div aria-hidden="true" style="width: ${size}px; height: ${size}px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; border: 2.5px solid ${ink}; padding: 3px; transform: rotate(${rot}deg); color: ${ink}">
    <div style="width: 100%; height: 100%; box-sizing: border-box; border-radius: 999px; border: 1px solid ${ink}; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${ink}14">
      <span style="font-family: ${SERIF}; font-size: ${Math.round(size * 0.3)}px; line-height: 1">${name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}</span>
      ${note ? `<span style="margin-top: 2px; font-size: ${Math.max(9, Math.round(size * 0.14))}px; font-weight: 700; letter-spacing: .06em">${note}</span>` : ""}
    </div>
  </div>`;
}

// ---- 1 · Passport home ------------------------------------------------------------
const TRIED = { "SnapEats": 14, "House of Chow": 9, "Paid Mess": 8, "Quench": 0 };
const usual = item("SnapEats", "Veg Kathi Rolls", "Paneer Kathi Roll");
const suggestions = [
  { ...item("SnapEats", "Veg Kathi Rolls", "Paneer Makhani Roll"), why: "Like your Paneer Kathi Roll" },
  { ...item("House of Chow", "Momos (8 Pcs)", "Veg Kurkure Momos"), why: "No Chow momos stamp yet" },
  { ...item("Paid Mess", "Amritsari Kulcha Combo", "Paneer Kulcha (Single)"), why: "Your first kulcha" },
];
const suggestCard = (d) => `
  <a href="#" aria-label="${d.name}, ₹${d.price}, ${d.stall}" style="flex-shrink: 0; width: 170px; box-sizing: border-box; padding: 10px; border-radius: 16px; border: 1px solid ${LINE}; text-decoration: none; color: inherit; position: relative">
    <div style="height: 70px; border-radius: 12px; background: ${stallOf(d.stall).tint}; display: flex; align-items: center; justify-content: center">${tile(d.name, 46, "#FFFFFF")}</div>
    <span style="position: absolute; top: 16px; left: 16px; padding: 2px 7px; border-radius: 999px; background: #FFFFFF; color: ${MINT_INK}; font-size: 11px; font-weight: 700">NEW</span>
    <div style="display: flex; gap: 5px; align-items: flex-start; margin-top: 8px">${vegMark(d.veg)}<span style="font-size: 14px; font-weight: 600; line-height: 1.2; height: 34px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical">${d.name}</span></div>
    <div style="margin-top: 3px; font-size: 12px; color: ${MUTED}">₹${d.price} · ${d.stall}</div>
    <div style="margin-top: 4px; font-size: 12px; color: ${MINT_INK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${d.why}</div>
  </a>`;
const stallPage = (s) => `
  <a href="#" aria-label="${s.name}, ${TRIED[s.name]} of ${s.dishes} tried, ${s.status}" style="display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 6px 0; border-bottom: 1px solid #EEF1ED; text-decoration: none; color: inherit; ${s.open ? "" : "opacity: .6"}">
    ${stamp(s.name, { tried: TRIED[s.name] > 0, ink: INKS[s.name], size: 46, rot: -10 })}
    <div style="flex: 1; min-width: 0">
      <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px"><span style="font-family: ${SERIF}; font-size: 18px">${s.name}</span><span style="font-size: 12px; color: ${MUTED}; white-space: nowrap">${s.open ? s.queue : "Paused"}</span></div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px"><div style="flex: 1">${bar(TRIED[s.name] / s.dishes, { color: INKS[s.name] })}</div><span style="font-size: 12px; color: ${MUTED}; white-space: nowrap">${TRIED[s.name]} / ${s.dishes}</span></div>
    </div>
    <span style="color: ${MUTED}">${chevron()}</span>
  </a>`;

const total = 605;
const triedAll = TRIED["SnapEats"] + TRIED["House of Chow"] + TRIED["Paid Mess"];
const home = frame(`
  ${band(`${topRow(logo, 0)}${bigTitle("Your food passport", `${triedAll} of ${total} campus dishes tried`)}
    <div style="margin-top: 12px">${bar(triedAll / total, { color: "#FFFFFF", track: "rgba(255,255,255,.18)", h: 8 })}</div>
    <div style="display: flex; gap: 8px; margin-top: 12px; font-size: 13px; color: ${ON_DECK}">
      <span style="padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.1)">4 new this month</span>
      <span style="padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.1)">3 of 4 stalls stamped</span>
    </div>`)}
  ${sheet(`
    ${sectionTitle("Try something new", "around your usual ₹120")}
    <div style="display: flex; gap: 10px; margin: 0 -20px 18px; padding: 0 20px; overflow: hidden">${suggestions.map(suggestCard).join("")}</div>
    ${sectionTitle("Stalls", "your stamps")}
    ${STALLS.map(stallPage).join("")}
  `)}`, TABS);

// ---- 2 · A stall's passport page ------------------------------------------------------
const snap = MENUS["SnapEats"];
const SNAP_TRIED = { "Chai Nagri": 3, "Sandwiches": 1, "Burgers": 2, "Crispy Snacks": 2, "Cold Beverages": 3, "Veg Kathi Rolls": 2, "Street Flavours": 1 };
const catStamp = (c, i) => {
  const n = SNAP_TRIED[c.name] ?? 0;
  return `
  <a href="#" aria-label="${c.name}, ${n} of ${c.count} tried" style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 2px; min-height: 44px; text-decoration: none; color: inherit; text-align: center">
    ${stamp(c.name, { tried: n > 0, ink: INKS["SnapEats"], size: 60, rot: [-9, 6, -4, 10, -12][i % 5], note: n ? `${n}×` : "" })}
    <span style="font-size: 12px; font-weight: 600; line-height: 1.2; height: 29px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical">${c.name}</span>
    <span style="margin-top: -4px; font-size: 11px; color: ${n ? INKS["SnapEats"] : MUTED}">${n ? `${n} tried · ${c.count - n} to try` : `${c.count} to try`}</span>
  </a>`;
};
const stallPassport = frame(`
  ${band(`${topRow(backLink("Passport"), 0)}${bigTitle("SnapEats", "14 of 144 tried · 7 of 14 sections stamped")}
    <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13px; color: ${ON_DECK}">${statusDot(stallOf("SnapEats")).replace("#1F6B43", "#9FE0B4").replace("#1F6B43", "#9FE0B4")}<span>Open till 10 pm · 1 in queue</span></div>`)}
  ${sheet(`
    ${chipRow([chip("All sections", { on: true }), chip("Not tried yet · 7"), chip("Drinks")].join(""), "margin-bottom: 10px")}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px 8px">${snap.categories.slice(0, 12).map(catStamp).join("")}</div>
  `, "padding-top: 16px")}`, TABS);

// ---- 3 · A section: new to you first ------------------------------------------------------
const rolls = cat("SnapEats", "Veg Kathi Rolls");
const had = { "Paneer Kathi Roll": "Had 3× · last Tue", "Veg Kathi Roll": "Had once · Sep" };
const triedRow = (it) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    ${stamp(it.name, { tried: true, ink: INKS["SnapEats"], size: 44, rot: -10 })}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(it.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span></div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">₹${it.price} · ${had[it.name]}</div></div>
    <button type="button" aria-label="Order ${it.name} again" style="height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 13px; font-weight: 600; color: ${INK}; white-space: nowrap">Again</button>
  </div>`;
const newRow = (it, qty = 0) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    ${stamp(it.name, { size: 44 })}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(it.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span></div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">₹${it.price} · <span style="color: ${MINT_INK}; font-weight: 600">New to you</span></div></div>
    ${qty ? `<div style="display: flex; align-items: center; height: 44px; border-radius: 999px; border: 1px solid ${GREEN}; color: ${GREEN}"><button type="button" aria-label="Remove one" style="width: 36px; height: 44px; border: 0; background: transparent; color: inherit; font-size: 18px">−</button><span style="font-size: 14px; font-weight: 600">${qty}</span><button type="button" aria-label="Add one more" style="width: 36px; height: 44px; border: 0; background: transparent; color: inherit; font-size: 18px">+</button></div>` : `<button type="button" aria-label="Add ${it.name}" style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; font-size: 18px; color: ${INK}">+</button>`}
  </div>`;
const newOnes = rolls.items.filter((it) => !had[it.name]);
const triedOnes = rolls.items.filter((it) => had[it.name]);
const sectionInner = `
    ${chipRow([chip("New to you first", { on: true }), chip("Cheapest"), chip("Veg")].join(""), "margin-bottom: 10px")}
    <div style="${upper}; color: ${MINT_INK}; margin-top: 4px">6 you haven't tried</div>
    ${newOnes.slice(0, 4).map((it, i) => newRow(it, i === 1 ? 1 : 0)).join("")}
    <a href="#" style="display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 44px; font-size: 14px; font-weight: 600; color: ${GREEN}; text-decoration: none">2 more ${chevron("down", 16)}</a>
    <div style="${upper}; color: ${MUTED}; margin-top: 2px">Already stamped</div>
    ${triedOnes.map(triedRow).join("")}
  `;
const sectionPage = frame(`
  ${band(`${topRow(backLink("SnapEats"), 1)}${bigTitle("Veg Kathi Rolls", "2 of 8 tried · ₹89–139")}`)}
  ${sheet(sectionInner, "padding-top: 16px")}
  ${bagPill(1, rolls.items[3].price)}`, TABS);

// ---- 4 · Your usual, with a twist -----------------------------------------------------------
const twistRow = (it, diff, extra = "") => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #EEF1ED">
    ${tile(it.name, 40, stallOf(it.stall ?? "SnapEats").tint)}
    <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(it.veg)}<span style="font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</span></div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">₹${it.price} <span style="color: ${diff.startsWith("−") ? "#1F6B43" : MUTED}">(${diff})</span>${extra}</div></div>
    <button type="button" aria-label="Try ${it.name}" style="height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid ${GREEN}; background: #FFFFFF; font-size: 14px; font-weight: 600; color: ${GREEN}">Try</button>
  </div>`;
const r = (n) => ({ ...rolls.items.find((i) => i.name === n), stall: "SnapEats" });
const twist = frame(`
  ${band(`${topRow(backLink("SnapEats"), 0)}${bigTitle("Veg Kathi Rolls", "2 of 8 tried · ₹89–139")}`)}
  ${sheet(sectionInner, "padding-top: 16px")}`, {
  ...TABS,
  overlay: bottomSheet(`
    <div style="display: flex; align-items: center; gap: 14px">
      ${stamp(usual.name, { tried: true, ink: INKS["SnapEats"], size: 62, rot: -10, note: "3×" })}
      <div style="flex: 1; min-width: 0"><div style="${upper}; color: ${MUTED}">Your usual</div><div style="font-family: ${SERIF}; font-size: 24px; line-height: 1.1">${usual.name}</div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">₹${usual.price} · SnapEats · last Tue</div></div>
    </div>
    <button type="button" style="margin-top: 14px; width: 100%; height: 50px; border-radius: 999px; border: 0; background: ${GREEN}; color: #FFFFFF; font-size: 16px; font-weight: 600">Order again · ₹${usual.price}</button>
    <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: baseline"><span style="font-family: ${SERIF}; font-size: 20px">Or try a twist</span><span style="font-size: 12px; color: ${MUTED}">same counter, same pickup</span></div>
    ${twistRow(r("Paneer Makhani Roll"), "+₹20")}
    ${twistRow(r("Paneer Schezwan Roll"), "+₹10")}
    ${twistRow(r("Paneer Shawarma Roll"), "−₹20")}
    <p style="margin: 12px 0 0; padding: 10px 12px; border-radius: 12px; background: ${MINT}; color: ${MINT_INK}; font-size: 13px">Also on campus: Paneer Tikka Roll at Paid Mess, ₹170</p>`, "64%"),
});

// ---- 5 · A new stamp after pickup -------------------------------------------------------------
const fresh = r("Paneer Makhani Roll");
const nextUp = suggestions[1];
const stamped = frame(`
  ${band(`<div style="display: flex; justify-content: flex-end; min-height: 44px"><button type="button" aria-label="Close" style="width: 44px; height: 44px; border-radius: 999px; border: 0; background: rgba(255,255,255,.12); color: #FFFFFF; font-size: 22px">×</button></div>
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 6px">
      <div style="${upper}; color: ${ON_DECK}">Picked up · SnapEats · 1:15 pm</div>
      <div style="position: relative; margin: 22px 0 18px; width: 172px; height: 172px">
        <div style="position: absolute; inset: 0; transform: rotate(-12deg); border-radius: 999px; border: 4px solid #F3D9A6; padding: 6px; box-sizing: border-box; color: #F3D9A6">
          <div style="width: 100%; height: 100%; box-sizing: border-box; border-radius: 999px; border: 1.5px dashed #F3D9A6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px">
            <span style="${upper}; font-size: 11px; letter-spacing: .14em">SnapEats</span>
            <span style="font-family: ${SERIF}; font-size: 46px; line-height: 1">PM</span>
            <span style="${upper}; font-size: 11px; letter-spacing: .14em">30 Oct 2026</span>
          </div>
        </div>
      </div>
      <h1 style="margin: 0; font-family: ${SERIF}; font-size: 32px; font-weight: 400; line-height: 1.1">New stamp!</h1>
      <p style="margin: 6px 0 0; font-size: 15px; color: #D6EBDC">${fresh.name} is dish ${triedAll + 1} of ${total}</p>
    </div>`, "14px 20px 26px")}
  ${sheet(`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
      <div style="padding: 12px; border-radius: 14px; border: 1px solid ${LINE}"><div style="font-family: ${SERIF}; font-size: 24px">3 / 8</div><div style="font-size: 12px; color: ${MUTED}">Veg Kathi Rolls</div><div style="margin-top: 8px">${bar(3 / 8, { color: INKS["SnapEats"] })}</div></div>
      <div style="padding: 12px; border-radius: 14px; border: 1px solid ${LINE}"><div style="font-family: ${SERIF}; font-size: 24px">15 / 144</div><div style="font-size: 12px; color: ${MUTED}">SnapEats</div><div style="margin-top: 8px">${bar(15 / 144, { color: INKS["SnapEats"] })}</div></div>
    </div>
    <div style="${upper}; color: ${MUTED}; margin: 18px 0 8px">Next on your passport</div>
    <a href="#" aria-label="${nextUp.name}, ₹${nextUp.price}, ${nextUp.stall}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: ${stallOf(nextUp.stall).tint}; text-decoration: none; color: inherit">
      ${stamp(nextUp.name, { size: 48 })}
      <div style="flex: 1; min-width: 0"><div style="display: flex; align-items: center; gap: 6px">${vegMark(nextUp.veg)}<span style="font-size: 15px; font-weight: 600">${nextUp.name}</span></div><div style="margin-top: 2px; font-size: 13px; color: ${MUTED}">₹${nextUp.price} · ${nextUp.stall} · your first momos there</div></div>${chevron()}
    </a>
    <button type="button" style="margin-top: 16px; width: 100%; height: 50px; border-radius: 999px; border: 1px solid #DCE2DB; background: #FFFFFF; color: ${INK}; font-size: 15px; font-weight: 600">Open my passport</button>
  `)}`, { ...TABS, activeTab: "orders" });

export const DESIGNS = [
  { title: "1 · Passport home", head, body: home },
  { title: "2 · A stall's stamp page", head, body: stallPassport },
  { title: "3 · Menu, new to you first", head, body: sectionPage },
  { title: "4 · Your usual, with a twist", head, body: twist },
  { title: "5 · New stamp after pickup", head, body: stamped },
];
